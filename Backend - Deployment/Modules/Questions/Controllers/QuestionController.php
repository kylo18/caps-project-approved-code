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

class QuestionController extends Controller
{
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

    public function update(Request $request, $questionID)
    {
        $this->authorizeRoles([2, 3, 4]);

        $validated = $request->validate([
            'subjectID' => 'required|exists:subjects,subjectID',
            'coverage' => 'required|in:midterm,finals',
            'questionText' => 'required|string',
            'image' => 'nullable|image|max:10240',
            'score' => 'required|integer|min:1',
            'difficulty' => 'required|in:easy,moderate,hard',
            'choices' => 'required|array|min:2|max:6',
            'choices.*.choiceID' => 'nullable|exists:choices,choiceID',
            'choices.*.choiceText' => 'nullable|string',
            'choices.*.isCorrect' => 'required|boolean',
            'choices.*.image' => 'nullable|image|max:10240',
        ]);

        if (!collect($validated['choices'])->contains('isCorrect', true)) {
            return response()->json(['message' => 'At least one correct choice is required.'], 422);
        }

        return DB::transaction(function () use ($validated, $request, $questionID) {
            $question = Question::findOrFail($questionID);

            $imagePath = $this->handleImageUpload($request, 'image', 'questions', $question->image);
            $question->update([
                'subjectID' => $validated['subjectID'],
                'coverage' => $validated['coverage'],
                'questionText' => Crypt::encryptString($validated['questionText']),
                'image' => $imagePath,
                'score' => $validated['score'],
                'difficulty' => $validated['difficulty'],
                'status' => Auth::user()->roleID === 2 ? 'pending' : 'approved',
            ]);

            $this->syncChoices($request, $question, $validated['choices']);

            return response()->json([
                'message' => 'Question updated successfully.',
                'question' => $question->load('choices')
            ]);
        });
    }

    public function indexQuestions($subjectID)
    {
        $subject = Subject::find($subjectID);
        if (!$subject) {
            return response()->json(['message' => 'Subject not found.'], 404);
        }

        Question::where('subjectID', $subjectID)
        ->doesntHave('choices')
        ->each(function ($q) {
            if ($q->image) {
                Storage::disk('public')->delete($q->image);
            }
            $q->delete();
        });

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

    public function mySubjectQuestions($subjectID)
    {
        $user = Auth::user();

        // Find the subject by ID
        $subject = Subject::find($subjectID);

        if (!$subject) {
            return response()->json([
                'message' => 'Subject not found.'
            ], 404);
        }

        // Get the questions added by the specific user for the given subject
        $questions = Question::with(['subject', 'choices'])
            ->where('subjectID', $subjectID)
            ->where('userID', $user->userID) // Ensure the questions belong to the authenticated user
            ->get()
            ->map(function ($question) {
                try {
                    // Decrypt the question text
                    $question->questionText = Crypt::decryptString($question->questionText);
                } catch (\Exception $e) {
                    $question->questionText = '[Decryption Error]';
                }

                // Format image URL if exists
                if ($question->image && !Str::startsWith($question->image, ['http://', 'https://'])) {
                    $question->image = url("storage/{$question->image}");
                }

                // Decrypt each choice and format its image URL
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

    public function indexQuestionsByProgram($subjectID)
    {
        $subject = Subject::find($subjectID);
        if (!$subject) {
            return response()->json(['message' => 'Subject not found.'], 404);
        }

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

    private function authorizeRoles(array $allowed)
    {
        if (!in_array(Auth::user()->roleID, $allowed)) {
            abort(response()->json(['message' => 'Unauthorized.'], 403));
        }
    }

    private function handleImageUpload(Request $request, $field, $folder, $existingPath = null)
    {
        // Try getting the file directly
        $file = $request->file($field);

        // If not found, try flattening the nested structure (e.g., 'question.image')
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


    private function syncChoices(Request $request, Question $question, array $choices)
    {
        foreach ($choices as $index => $choiceData) {
            $path = $this->handleImageUpload($request, "choices.$index.image", 'choices', optional(Choice::find($choiceData['choiceID'] ?? null))->image);

            $encryptedText = $choiceData['choiceText']
                ? Crypt::encryptString($choiceData['choiceText']) : null;

            if (isset($choiceData['choiceID'])) {
                Choice::find($choiceData['choiceID'])->update([
                    'choiceText' => $encryptedText,
                    'isCorrect' => $choiceData['isCorrect'],
                    'image' => $path,
                ]);
            } else {
                Choice::create([
                    'questionID' => $question->questionID,
                    'choiceText' => $encryptedText,
                    'isCorrect' => $choiceData['isCorrect'],
                    'image' => $path,
                ]);
            }
        }
    }

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

    private function generateUrl($path)
    {
        return $path && !Str::startsWith($path, ['http://', 'https://']) ? url("storage/$path") : $path;
    }
}
