<?php

namespace Modules\Questions\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Str;
use Modules\Subjects\Models\Subject;
use Modules\Questions\Models\Question;
use Modules\Choices\Models\Choice;
use Illuminate\Support\Facades\Validator;

class QuestionController extends Controller
{
    // Store a new question into the database
    public function store(Request $request)
    {
        $this->authorizeRoles([2, 3, 4]);

        $validated = $request->validate([
            'subjectID' => 'required|exists:subjects,subjectID',
            'coverage' => 'required|in:midterm,finals',
            'questionText' => 'required|string',
            'image' => 'nullable|image|max:2048',
            'score' => 'required|integer|min:1',
            'difficulty' => 'required|in:easy,moderate,hard',
            'status' => 'required|in:pending,approved,disapproved',
            'purpose' => 'required|in:examQuestions,practiceQuestions'
        ]);

        return DB::transaction(function () use ($validated, $request) {
            $imagePath = $this->handleImageUpload($request, 'image', 'question_images');
            $question = Question::create([
                'subjectID' => $validated['subjectID'],
                'userID' => Auth::id(),
                'coverage' => $validated['coverage'],
                'questionText' => Crypt::encryptString($validated['questionText']),
                'image' => $imagePath,
                'score' => $validated['score'],
                'difficulty' => $validated['difficulty'],
                'status' => 'pending',
                'purpose' => $validated['purpose'],
            ]);

            return response()->json([
                'message' => 'Question created successfully.',
                'data' => $this->formatQuestion($question->fresh(['user']))
            ], 201);
        });
    }

    // Update an existing question and mark it as pending
    public function update(Request $request, $questionID)
    {
        $question = Question::findOrFail($questionID);

        $validated = $request->validate([
            'coverage' => 'sometimes|required|in:midterm,finals',
            'questionText' => 'sometimes|required|string',
            'image' => 'nullable|image|max:10240',
            'score' => 'sometimes|required|integer|min:1',
            'difficulty' => 'sometimes|required|in:easy,moderate,hard',
            'status' => 'sometimes|required|in:pending,approved,disapproved',
            'purpose' => 'sometimes|required|in:examQuestions,practiceQuestions',
        ]);

        if (isset($validated['questionText'])) {
            $question->questionText = Crypt::encryptString($validated['questionText']);
        }

        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('question_images', 'public');
            $question->image = $path;
        }

        foreach (['coverage', 'score', 'difficulty', 'purpose'] as $field) {
            if (isset($validated[$field])) {
                $question->$field = $validated[$field];
            }
        }

        // Force status to 'pending' after update
        $question->status = 'pending';

        $question->save();

        return response()->json(['message' => 'Question updated successfully and marked as pending.']);
    }

    // List all questions for a subject, remove those without choices
    public function indexQuestions($subjectID)
    {
        $subject = Subject::find($subjectID);
        if (!$subject) {
            return response()->json(['message' => 'Subject not found.'], 404);
        }

        // Delete questions with no choices
        Question::where('subjectID', $subjectID)
        ->doesntHave('choices')
        ->each(function ($q) {
            if ($q->image) {
                Storage::disk('public')->delete($q->image);
            }
            $q->delete();
        });

        // Get questions with choices only
        $questions = Question::with(['subject', 'choices', 'user'])
            ->where('subjectID', $subjectID)
            ->get()
            ->reject(fn($q) => $q->choices->isEmpty())
            ->map(fn($q) => $this->formatQuestion($q))
            ->values();

        return response()->json([
            'message' => 'Questions retrieved successfully.',
            'subject' => $subject->subjectName,
            'data' => $questions
        ]);
    }

    // Delete a specific question
    public function destroy($questionID)
    {
        $this->authorizeRoles([2, 3, 4]);

        $question = Question::find($questionID);
        if (!$question) {
            return response()->json(['message' => 'Question not found.'], 404);
        }

        if ($question->image) {
            Storage::disk('public')->delete($question->image);
        }
        $question->delete();

        return response()->json(['message' => 'Question deleted successfully.']);
    }

    // Retrieve all questions created by the current user for a given subject
    public function mySubjectQuestions($subjectID)
    {
        $user = Auth::user();

        $subject = Subject::find($subjectID);
        if (!$subject) {
            return response()->json([
                'message' => 'Subject not found.'
            ], 404);
        }

        $questions = Question::with(['subject', 'choices'])
            ->where('subjectID', $subjectID)
            ->where('userID', $user->userID)
            ->get()
            ->map(function ($question) {
                try {
                    $question->questionText = Crypt::decryptString($question->questionText);
                } catch (\Exception $e) {
                    $question->questionText = '[Decryption Error]';
                }

                if ($question->image && !Str::startsWith($question->image, ['http://', 'https://'])) {
                    $question->image = url("storage/{$question->image}");
                }

                $question->choices->map(function ($choice) {
                    try {
                        $choice->choiceText = Crypt::decryptString($choice->choiceText);
                    } catch (\Exception $e) {
                        $choice->choiceText = null;
                    }

                    if ($choice->image && !Str::startsWith($choice->image, ['http://', 'https://'])) {
                        $choice->image = url("storage/{$choice->image}");
                    }

                    return $choice;
                });

                return $question;
            });

        return response()->json([
            'message' => 'Your questions for this subject retrieved successfully!',
            'subject' => $subject->subjectName,
            'data'    => $questions
        ], 200);
    }

    // Approve a question if it's pending and not owned by the current user
    public function updateStatus($questionID)
    {
        $this->authorizeRoles([3, 4]);

        $question = Question::find($questionID);
        if (!$question) {
            return response()->json(['message' => 'Question not found.'], 404);
        }
        if ($question->status !== 'pending') {
            return response()->json([
                'message' => 'Only questions with pending status can be approved.',
                'current_status' => $question->status
            ], 400);
        }
        if (Auth::id() === $question->userID) {
            return response()->json(['message' => 'You cannot approve your own question.'], 403);
        }

        $question->update(['status' => 'approved']);

        return response()->json(['message' => 'Question approved.', 'question' => $question]);
    }

    // Show questions by subject and filter them by the program of the logged-in Program Chair
    public function indexQuestionsByProgram($subjectID)
    {
        $subject = Subject::find($subjectID);
        if (!$subject) {
            return response()->json(['message' => 'Subject not found.'], 404);
        }

        // Remove questions with no choices
        Question::where('subjectID', $subjectID)
        ->doesntHave('choices')
        ->each(function ($q) {
            if ($q->image) {
                Storage::disk('public')->delete($q->image);
            }
            $q->delete();
        });

        $query = Question::with(['subject', 'choices', 'user'])
            ->where('subjectID', $subjectID);

        // If user is Program Chair, filter questions by their program
        if (Auth::user()->roleID == 3) {
            $query->whereHas('user', fn($q) => $q->where('programID', Auth::user()->programID));
        }

        $questions = $query->get()->map(fn($q) => $this->formatQuestion($q));

        return response()->json([
            'message' => 'Questions filtered by program retrieved.',
            'subject' => $subject->subjectName,
            'data' => $questions
        ]);
    }

    // ============ PRIVATE HELPERS ============

    // Ensure only users with certain roles can access specific methods
    private function authorizeRoles(array $allowed)
    {
        if (!in_array(Auth::user()->roleID, $allowed)) {
            abort(response()->json(['message' => 'Unauthorized.'], 403));
        }
    }

    // Handle image upload, supports both flat and nested fields
    private function handleImageUpload(Request $request, $field, $folder, $existingPath = null)
    {
        $file = $request->file($field);

        if (!$file) {
            $flatKey = str_replace(['[', ']'], ['.', ''], $field);
            $file = data_get($request->allFiles(), $flatKey);
        }

        if ($file && $file->isValid()) {
            if ($existingPath) {
                Storage::disk('public')->delete($existingPath);
            }
            return $file->store($folder, 'public');
        }

        return $existingPath;
    }

    // Decrypt and format question and its choices for display
    private function formatQuestion($question)
    {
        try {
            $question->questionText = Crypt::decryptString($question->questionText);
        } catch (\Exception $e) {
            $question->questionText = '[Decryption Error]';
        }

        $question->image = $this->generateUrl($question->image);
        $question->creatorName = optional($question->user)->firstName . ' ' . optional($question->user)->lastName;

        $question->choices->transform(function ($choice) {
            try {
                $choice->choiceText = Crypt::decryptString($choice->choiceText);
            } catch (\Exception $e) {
                $choice->choiceText = null;
            }
            $choice->image = $this->generateUrl($choice->image);
            return $choice;
        });

        return $question;
    }

    // Generate a full URL for images stored in the public disk
    private function generateUrl($path)
    {
        return $path && !Str::startsWith($path, ['http://', 'https://']) ? url("storage/$path") : $path;
    }
}
