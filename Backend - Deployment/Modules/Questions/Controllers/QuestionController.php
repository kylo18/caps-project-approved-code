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
        $this->authorizeRoles([2, 3, 4, 5]);

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

        // Restrict exam questions (purpose_id 3) if subject is disabled
        if ($validated['purpose_id'] == 3) {
            $subject = Subject::find($validated['subjectID']);
            if (!$subject || !$subject->is_enabled_for_exam_questions) {
                return response()->json(['message' => 'Adding exam questions is currently disabled for this subject.'], 403);
            }
        }

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

        // Restrict editing exam questions (purpose_id 3) if subject is disabled
        if ($question->purpose_id == 3) {
            $subject = Subject::find($question->subjectID);
            if (!$subject || !$subject->is_enabled_for_exam_questions) {
                return response()->json(['message' => 'Editing exam questions is currently disabled for this subject.'], 403);
            }
        }

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

        // Always set status to pending on update and record who edited it
        $pendingStatus = Status::where('name', 'pending')->first();
        if ($pendingStatus) {
            $question->status_id = $pendingStatus->id;
        }
        
        // Record who last edited the question
        $question->editedBy = Auth::id();
        // Clear approvedBy when question is edited since it needs to be re-approved
        $question->approvedBy = null;

        $question->save();

        return response()->json([
            'message' => 'Question updated successfully and marked as pending.',
            'data' => $this->formatQuestion($question)
        ]);
    }

    // List all questions for a subject, remove those without choices
    public function indexQuestions($subjectID)
    {
        $subject = Subject::findOrFail($subjectID);

        // Check if user is Program Chair or Associate Dean
        $user = Auth::user();
        $isProgramChair = $user->roleID === 3;
        $isAssociateDean = $user->roleID === 5;

        // Base query with relationships
        $query = Question::with([
                'subject', 
                'choices', 
                'user', 
                'status', 
                'difficulty', 
                'coverage', 
                'purpose',
                'editor' => function($query) {
                    $query->select('userID', 'firstName', 'lastName');
                },
                'approver' => function($query) {
                    $query->select('userID', 'firstName', 'lastName');
                }
            ])
            ->where('subjectID', $subjectID)
            ->whereHas('choices');

        // Apply program-based filtering for Program Chairs, but also include questions added by the Dean (roleID 4)
        if ($isProgramChair) {
            $query->where(function($q) use ($user) {
                $q->whereHas('user', function($q2) use ($user) {
                    $q2->where('programID', $user->programID);
                })
                ->orWhereHas('user', function($q2) {
                    $q2->where('roleID', 4); // Dean
                });
            });
        }

        // Apply campus-based filtering for Associate Deans
        if ($isAssociateDean) {
            $query->whereHas('user', function($q) use ($user) {
                $q->where('campusID', $user->campusID);
            });
        }

        $questions = $query->orderBy('created_at', 'desc')
            ->get()
            ->map(fn($q) => $this->formatQuestion($q));

        return response()->json([
            'message' => 'Questions retrieved successfully.',
            'subject' => $subject->subjectName,
            'total_questions' => $questions->count(),
            'data' => $questions,
            'last_updated' => $questions->max('updated_at')
        ]);
    }

    // Delete a specific question
    public function destroy($questionID)
    {
        $this->authorizeRoles([2, 3, 4, 5]);

        $question = Question::find($questionID);
        if (!$question) {
            return response()->json(['message' => 'Question not found.'], 404);
        }

        // Restrict deleting exam questions (purpose_id 3) if subject is disabled
        if ($question->purpose_id == 3) {
            $subject = Subject::find($question->subjectID);
            if (!$subject || !$subject->is_enabled_for_exam_questions) {
                return response()->json(['message' => 'Deleting exam questions is currently disabled for this subject.'], 403);
            }
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

    // Approve a question if it's pending and not edited by the current user
    public function updateStatus($questionID)
    {
        $this->authorizeRoles([3, 4, 5]);

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

        // Check if the current user is the creator and the question hasn't been edited yet
        if (Auth::id() === $question->userID && !$question->editedBy) {
            return response()->json(['message' => 'You cannot approve your own question.'], 403);
        }

        // Check if the current user is the one who last edited the question
        if (Auth::id() === $question->editedBy) {
            return response()->json(['message' => 'You cannot approve a question you last edited.'], 403);
        }

        $approvedStatus = Status::where('name', 'approved')->first();
        if ($approvedStatus) {
            $question->status_id = $approvedStatus->id;
            // Update the approvedBy field with the current user
            $question->approvedBy = Auth::id();
            $question->save();
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
        $this->authorizeRoles([2, 3, 4, 5]);

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
            // Set the current user as the creator of the duplicated question
            $newQuestion->userID = Auth::id();
            // Set initial status as pending
            $newQuestion->status_id = Status::where('name', 'pending')->first()->id;
            // Clear editor and approver information for the new question
            $newQuestion->editedBy = null;
            $newQuestion->approvedBy = null;

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
                'message' => 'Question duplicated successfully. You are now set as the creator of this new question.',
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

    /**
     * Preview all questions from a student's perspective
     * This function is accessible to faculty, program chair, and dean
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function previewAllQuestions(Request $request)
    {
        $this->authorizeRoles([2, 3, 4, 5]); // Only faculty, program chair, and dean

        try {
            $query = Question::with([
                'subject',
                'choices',
                'status',
                'difficulty',
                'coverage',
                'purpose',
                'user' => function($query) {
                    $query->select('userID', 'firstName', 'lastName', 'programID');
                }
            ])->whereHas('status', function($query) {
                $query->where('name', 'approved');
            });

            // If user is Program Chair, only show questions from their program
            if (Auth::user()->roleID === 3) {
                $query->whereHas('user', function($q) {
                    $q->where('programID', Auth::user()->programID)
                      ->orWhere('programID', 6); // Include general education questions
                });
            }

            // Group questions by subject
            $questions = $query->get()
                ->groupBy('subjectID')
                ->map(function($subjectQuestions) {
                    $subject = $subjectQuestions->first()->subject;
                    
                    // Group questions by coverage (midterm/finals)
                    $questionsByCoverage = $subjectQuestions->groupBy(function($q) {
                        return $q->coverage->name;
                    })->map(function($coverageQuestions) {
                        // Group by difficulty
                        return $coverageQuestions->groupBy(function($q) {
                            return $q->difficulty->name;
                        })->map(function($questions) {
                            return $questions->map(function($q) {
                                return $this->formatQuestionForPreview($q);
                            });
                        });
                    });

                    return [
                        'subjectName' => $subject->subjectName,
                        'subjectCode' => $subject->subjectCode,
                        'questions' => $questionsByCoverage
                    ];
                });

            return response()->json([
                'message' => 'Questions preview retrieved successfully.',
                'data' => $questions
            ]);

        } catch (\Exception $e) {
            Log::error('Question Preview Error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to retrieve questions preview.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Format question for preview display
     * Similar to formatQuestion but with additional student-perspective formatting
     */
    private function formatQuestionForPreview($question)
    {
        try {
            $questionText = Crypt::decryptString($question->questionText);
        } catch (\Exception $e) {
            $questionText = '[Decryption Error]';
            Log::error("Question decrypt error ID{$question->questionID}: {$e->getMessage()}");
        }

        // Format choices like they would appear to students
        $choices = $question->choices->map(function($choice) {
            try {
                $text = $choice->choiceText ? Crypt::decryptString($choice->choiceText) : null;
            } catch (\Exception $e) {
                $text = null;
            }

            return [
                'text' => $text,
                'image' => $this->generateUrl($choice->image),
                'position' => $choice->position,
                'isCorrect' => $choice->isCorrect // Include correct answer for faculty review
            ];
        })->sortBy('position')->values();

        return [
            'questionID' => $question->questionID,
            'questionText' => $questionText,
            'questionImage' => $this->generateUrl($question->image),
            'score' => $question->score,
            'difficulty' => $question->difficulty->name,
            'coverage' => $question->coverage->name,
            'purpose' => $question->purpose->name,
            'choices' => $choices,
            'creator' => [
                'name' => $question->user->firstName . ' ' . $question->user->lastName,
                'program' => $question->user->programID
            ]
        ];
    }

    // Return all questions without choices
    public function questionCount()
    {
        $questions = Question::with([
            'subject',
            'user.program', // eager load user's program
            'user.role',    // eager load user's role
            'status',
            'difficulty',
            'coverage',
            'purpose',
            'editor' => function($query) {
                $query->select('userID', 'firstName', 'lastName');
            },
            'approver' => function($query) {
                $query->select('userID', 'firstName', 'lastName');
            }
        ])->get();

        // Format questions but skip choices
        $formatted = $questions->map(function($q) {
            try {
                $q->questionText = \Crypt::decryptString($q->questionText);
            } catch (\Exception $e) {
                $q->questionText = '[Decryption Error]';
            }
            $q->image = $this->generateUrl($q->image);
            $q->creatorName = optional($q->user)->firstName . ' ' . optional($q->user)->lastName;
            $q->editorName = optional($q->editor)->firstName . ' ' . optional($q->editor)->lastName;
            $q->approverName = optional($q->approver)->firstName . ' ' . optional($q->approver)->lastName;
            $q->status_name = optional($q->status)->name;
            $q->difficulty_name = optional($q->difficulty)->name;
            $q->coverage_name = optional($q->coverage)->name;
            $q->purpose_name = optional($q->purpose)->name;
            // Add program name
            $q->program = optional(optional($q->user)->program)->programName;
            // Add role name, but if Instructor, return Faculty
            $roleName = optional(optional($q->user)->role)->roleName;
            $q->role = ($roleName === 'Instructor') ? 'Faculty' : $roleName;
            unset($q->choices); // Remove choices if present
            return $q;
        });

        return response()->json([
            'message' => 'All questions retrieved successfully (no choices).',
            'total_questions' => $formatted->count(),
            'data' => $formatted
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
        
        // Add editor and approver information
        $question->editorName = optional($question->editor)->firstName . ' ' . optional($question->editor)->lastName;
        $question->approverName = optional($question->approver)->firstName . ' ' . optional($question->approver)->lastName;

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

