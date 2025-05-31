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
use Modules\Questions\Models\Purpose;
use Modules\Questions\Models\Status;
use Modules\Questions\Models\Coverage;
use Modules\Questions\Models\Difficulty;
use Illuminate\Support\Facades\Log;
use Modules\Choices\Models\Choice;

class QuestionController extends Controller
{
    // Store a new question into the database
    public function store(Request $request)
    {
        $this->authorizeRoles([2, 3, 4]);

        $validated = $request->validate([
            'subjectID' => 'required|exists:subjects,subjectID',
            'coverage_id' => 'required|exists:coverages,id',
            'questionText' => 'required|string',
            'image' => 'nullable|image|max:2048',
            'score' => 'required|integer|min:1',
            'difficulty_id' => 'required|exists:difficulties,id',
            'status_id' => 'required|exists:statuses,id',
            'purpose_id' => 'required|exists:purposes,id'
        ]);

        return DB::transaction(function () use ($validated, $request) {
            $imagePath = $this->handleImageUpload($request, 'image', 'question_images');
            $question = Question::create([
                'subjectID' => $validated['subjectID'],
                'userID' => Auth::id(),
                'coverage_id' => $validated['coverage_id'],
                'questionText' => Crypt::encryptString($validated['questionText']),
                'image' => $imagePath,
                'score' => $validated['score'],
                'difficulty_id' => $validated['difficulty_id'],
                'status_id' => $validated['status_id'],
                'purpose_id' => $validated['purpose_id'],
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
            'coverage_id' => 'sometimes|required|exists:coverages,id',
            'questionText' => 'sometimes|required|string',
            'image' => 'nullable',
            'score' => 'sometimes|required|integer|min:1',
            'difficulty_id' => 'sometimes|required|exists:difficulties,id',
            'status_id' => 'sometimes|required|exists:statuses,id',
            'purpose_id' => 'sometimes|required|exists:purposes,id'
        ]);

        if (isset($validated['questionText'])) {
            $question->questionText = Crypt::encryptString($validated['questionText']);
        }

        // Handle image update or removal
        $hasNewImage = false;
        if (isset($validated['image'])) {
            if (filter_var($validated['image'], FILTER_VALIDATE_URL)) {
                // If it's a URL, keep the existing image
                $hasNewImage = true;
            } elseif ($request->hasFile('image')) {
                // If there's an old image, delete it
                if ($question->image) {
                    Storage::disk('public')->delete($question->image);
                }
                // Store the new image
                $path = $request->file('image')->store('question_images', 'public');
                $question->image = $path;
                $hasNewImage = true;
            } elseif ($validated['image'] === null) {
                // If image is explicitly set to null, delete the existing image
                if ($question->image) {
                    Storage::disk('public')->delete($question->image);
                }
                $question->image = null;
            }
        }

        // Clear image if text is updated and no new image is provided
        if (!$hasNewImage && isset($validated['questionText'])) {
            if ($question->image) {
                Storage::disk('public')->delete($question->image);
            }
            $question->image = null;
        }

        if (isset($validated['coverage_id'])) {
            $question->coverage_id = $validated['coverage_id'];
        }
        if (isset($validated['score'])) {
            $question->score = $validated['score'];
        }
        if (isset($validated['difficulty_id'])) {
            $question->difficulty_id = $validated['difficulty_id'];
        }
        if (isset($validated['purpose_id'])) {
            $question->purpose_id = $validated['purpose_id'];
        }

        // Always set status to pending on update
        $pendingStatus = Status::where('name', 'pending')->first();
        if ($pendingStatus) {
            $question->status_id = $pendingStatus->id;
        }

        $question->save();

        return response()->json([
            'message' => 'Question updated successfully and marked as pending.',
            'data' => $this->formatQuestion($question)
        ]);
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
        $questions = Question::with(['subject', 'choices', 'user', 'status', 'difficulty', 'coverage', 'purpose'])
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

        $questions = Question::with(['subject', 'choices', 'status', 'difficulty', 'coverage', 'purpose'])
            ->where('subjectID', $subjectID)
            ->where('userID', $user->userID)
            ->get()
            ->map(function ($question) {
                return $this->formatQuestion($question);
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

        $pendingStatus = Status::where('name', 'pending')->first();
        if (!$pendingStatus || $question->status_id !== $pendingStatus->id) {
            return response()->json([
                'message' => 'Only questions with pending status can be approved.',
                'current_status' => optional($question->status)->name
            ], 400);
        }

        if (Auth::id() === $question->userID) {
            return response()->json(['message' => 'You cannot approve your own question.'], 403);
        }

        $approvedStatus = Status::where('name', 'approved')->first();
        if ($approvedStatus) {
            $question->update(['status_id' => $approvedStatus->id]);
        }

        return response()->json(['message' => 'Question approved.', 'question' => $this->formatQuestion($question)]);
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

        $query = Question::with(['subject', 'choices', 'user', 'status', 'difficulty', 'coverage', 'purpose'])
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

    /**
     * Duplicate a question and its choices with optional modifications
     *
     * @param int $questionID
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function duplicate(Request $request, $questionID)
    {
        $this->authorizeRoles([2, 3, 4]);

        try {
            // Validate optional modifications
            $validated = $request->validate([
                'coverage_id' => 'nullable|exists:coverages,id',
                'questionText' => 'nullable|string',
                'image' => 'nullable',
                'score' => 'nullable|integer|min:1',
                'difficulty_id' => 'nullable|exists:difficulties,id',
                'purpose_id' => 'nullable|exists:purposes,id',
                'choices' => 'nullable|array',
                'choices.*.choiceText' => 'nullable|string',
                'choices.*.isCorrect' => 'nullable|boolean',
                'choices.*.image' => 'nullable'
            ]);

            // Find original question with its choices
            $originalQuestion = Question::with(['choices' => function($query) {
                $query->orderBy('position', 'asc');
            }])->findOrFail($questionID);

            DB::beginTransaction();

            // Create new question with modifications
            $newQuestion = $originalQuestion->replicate();
            $newQuestion->userID = Auth::id();
            $newQuestion->status_id = Status::where('name', 'pending')->first()->id;

            // Apply modifications if provided
            if (isset($validated['questionText'])) {
                $newQuestion->questionText = Crypt::encryptString($validated['questionText']);
            }
            if (isset($validated['coverage_id'])) {
                $newQuestion->coverage_id = $validated['coverage_id'];
            }
            if (isset($validated['score'])) {
                $newQuestion->score = $validated['score'];
            }
            if (isset($validated['difficulty_id'])) {
                $newQuestion->difficulty_id = $validated['difficulty_id'];
            }
            if (isset($validated['purpose_id'])) {
                $newQuestion->purpose_id = $validated['purpose_id'];
            }

            // Handle question image
            if ($request->hasFile('image')) {
                // If new image is being uploaded
                $path = $request->file('image')->store('question_images', 'public');
                $newQuestion->image = $path;
            } 
            // If image is being explicitly removed
            elseif (isset($validated['image']) && $validated['image'] === null) {
                $newQuestion->image = null;
            }
            // If keeping original image or no image modification requested
            elseif ($originalQuestion->image) {
                $originalPath = $originalQuestion->image;
                // If it's a URL, keep it as is
                if (filter_var($originalPath, FILTER_VALIDATE_URL)) {
                    $newQuestion->image = $originalPath;
                }
                // If it's a storage file, create a copy
                elseif (Storage::disk('public')->exists($originalPath)) {
                    $extension = pathinfo($originalPath, PATHINFO_EXTENSION);
                    $newPath = 'question_images/' . uniqid() . '.' . $extension;
                    if (Storage::disk('public')->copy($originalPath, $newPath)) {
                        $newQuestion->image = $newPath;
                    }
                }
            }

            $newQuestion->save();

            // Duplicate choices with modifications
            $hasCorrectChoice = false;
            $originalChoices = $originalQuestion->choices->where('position', '!=', 5);
            
            foreach ($originalChoices as $index => $originalChoice) {
                $newChoice = $originalChoice->replicate();
                $newChoice->questionID = $newQuestion->questionID;

                // Apply modifications if provided
                if (isset($validated['choices'][$index])) {
                    $choiceData = $validated['choices'][$index];
                    
                    // Handle choice image
                    if (isset($choiceData['image'])) {
                        // If new image is being uploaded
                        if ($request->hasFile("choices.{$index}.image")) {
                            $newChoice->choiceText = null;
                            $path = $request->file("choices.{$index}.image")->store('choices', 'public');
                            $newChoice->image = $path;
                        } 
                        // If image is being explicitly removed
                        elseif ($choiceData['image'] === null) {
                            $newChoice->image = null;
                            if (isset($choiceData['choiceText'])) {
                                $newChoice->choiceText = Crypt::encryptString($choiceData['choiceText']);
                            }
                        } 
                        // If keeping original image
                        elseif ($originalChoice->image) {
                            $originalPath = $originalChoice->image;
                            // If it's a URL, keep it as is
                            if (filter_var($originalPath, FILTER_VALIDATE_URL)) {
                                $newChoice->image = $originalPath;
                                $newChoice->choiceText = null;
                            }
                            // If it's a storage file, create a copy
                            elseif (Storage::disk('public')->exists($originalPath)) {
                                $extension = pathinfo($originalPath, PATHINFO_EXTENSION);
                                $newPath = 'choices/' . uniqid() . '.' . $extension;
                                if (Storage::disk('public')->copy($originalPath, $newPath)) {
                                    $newChoice->image = $newPath;
                                    $newChoice->choiceText = null;
                                }
                            }
                        }
                    }
                    // If no image modification, handle text
                    else if (isset($choiceData['choiceText'])) {
                        $newChoice->choiceText = Crypt::encryptString($choiceData['choiceText']);
                        $newChoice->image = null;
                    }
                    // If neither image nor text is modified, keep the original
                    else {
                        if ($originalChoice->image) {
                            $originalPath = $originalChoice->image;
                            // If it's a URL, keep it as is
                            if (filter_var($originalPath, FILTER_VALIDATE_URL)) {
                                $newChoice->image = $originalPath;
                            }
                            // If it's a storage file, create a copy
                            elseif (Storage::disk('public')->exists($originalPath)) {
                                $extension = pathinfo($originalPath, PATHINFO_EXTENSION);
                                $newPath = 'choices/' . uniqid() . '.' . $extension;
                                if (Storage::disk('public')->copy($originalPath, $newPath)) {
                                    $newChoice->image = $newPath;
                                }
                            }
                        }
                    }

                    if (isset($choiceData['isCorrect'])) {
                        $newChoice->isCorrect = $choiceData['isCorrect'];
                    }
                }
                // If no modifications provided for this choice, copy the original image if it exists
                else if ($originalChoice->image) {
                    $originalPath = $originalChoice->image;
                    // If it's a URL, keep it as is
                    if (filter_var($originalPath, FILTER_VALIDATE_URL)) {
                        $newChoice->image = $originalPath;
                    }
                    // If it's a storage file, create a copy
                    elseif (Storage::disk('public')->exists($originalPath)) {
                        $extension = pathinfo($originalPath, PATHINFO_EXTENSION);
                        $newPath = 'choices/' . uniqid() . '.' . $extension;
                        if (Storage::disk('public')->copy($originalPath, $newPath)) {
                            $newChoice->image = $newPath;
                        }
                    }
                }

                if ($newChoice->isCorrect) {
                    $hasCorrectChoice = true;
                }

                $newChoice->position = $index + 1;
                $newChoice->save();
            }

            // Add "None of the above" choice
            Choice::create([
                'questionID' => $newQuestion->questionID,
                'choiceText' => Crypt::encryptString('None of the above.'),
                'isCorrect'  => !$hasCorrectChoice,
                'image'      => null,
                'position'   => 5
            ]);

            DB::commit();

            // Load the new question with all its relationships
            $newQuestion = Question::with(['choices', 'user', 'status', 'difficulty', 'coverage', 'purpose'])
                ->find($newQuestion->questionID);

            return response()->json([
                'message' => 'Question duplicated successfully with modifications.',
                'data' => $this->formatQuestion($newQuestion)
            ], 201)->header('Content-Type', 'application/json');

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Question duplication failed: " . $e->getMessage());

            return response()->json([
                'message' => 'Failed to duplicate question.',
                'error' => $e->getMessage()
            ], 500)->header('Content-Type', 'application/json');
        }
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

        // Add related model names for easier frontend handling
        $question->status_name = optional($question->status)->name;
        $question->difficulty_name = optional($question->difficulty)->name;
        $question->coverage_name = optional($question->coverage)->name;
        $question->purpose_name = optional($question->purpose)->name;

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
        if (!$path) {
            return null;
        }

        // If it's already a full URL, return as is
        if (Str::startsWith($path, ['http://', 'https://'])) {
            return $path;
        }

        // Check if the file exists in storage
        if (!Storage::disk('public')->exists($path)) {
            return null;
        }

        // Generate the full URL for the existing file
        return asset('storage/' . $path);
    }
}

