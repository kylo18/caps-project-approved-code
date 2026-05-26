<?php

namespace Modules\PersonalExams\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Modules\PersonalExams\Models\PersonalQuizQuestion;
use Modules\PersonalExams\Models\PersonalQuiz;
use Modules\PersonalExams\Models\PersonalQuizChoice;
use Modules\Questions\Models\Question;
use Modules\Choices\Models\Choice;

class PersonalQuizQuestionController extends Controller
{
    /**
     * List all questions for a specific personal quiz.
     */
    public function index($personalQuizID)
    {
        try {
            $user = Auth::user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized',
                ], 401);
            }

            // Verify the quiz exists and belongs to the user (or check permissions)
            $quiz = PersonalQuiz::with(['subject', 'quizType'])->find($personalQuizID);
            
            if (!$quiz) {
                return response()->json([
                    'success' => false,
                    'message' => 'Personal quiz not found.',
                ], 404);
            }

            // Check if user owns the quiz or has appropriate permissions
            if ($quiz->created_by !== $user->userID && !in_array($user->roleID, [3, 4, 5])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Forbidden. You do not have permission to view this quiz.',
                ], 403);
            }

            // Get all questions (both imported and manually added)
            $questions = PersonalQuizQuestion::with([
                    'personalQuizChoices',
                    'question' => function($query) {
                        // Only load if questionID is not null (for imported questions)
                        $query->with(['subject', 'difficulty', 'coverage']);
                    },
                    'personalQuizSubject',
                    'personalQuizCoverage',
                    'personalQuizUser' => function($query) {
                        $query->select('userID', 'firstName', 'lastName');
                    }
                ])
                ->where('personalQuizID', $personalQuizID)
                ->where('personalQuizUserID', $user->userID)
                ->orderBy('created_at', 'asc')
                ->get()
                ->map(function ($question) {
                    return $this->formatPersonalQuizQuestion($question);
                });

            return response()->json([
                'success' => true,
                'message' => 'Personal quiz questions retrieved successfully.',
                'quiz' => $quiz,
                'questions' => $questions,
                'total' => $questions->count(),
            ], 200);
        } catch (\Throwable $e) {
            Log::error('Error listing personal quiz questions', [
                'user_id' => optional(Auth::user())->userID,
                'personal_quiz_id' => $personalQuizID,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An error occurred while retrieving personal quiz questions.',
            ], 500);
        }
    }

    /**
     * Handle image upload (mirrors Questions controller behavior).
     */
    private function handleImageUpload(Request $request, string $field, string $folder, string $existingPath = null)
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

    /**
     * Copy an existing image if it's a local storage file; keep URL as is.
     */
    private function copyImageIfNeeded(?string $path, string $folder)
    {
        if (!$path) {
            return null;
        }

        // If already a full URL, return as is
        if (str_starts_with($path, 'http://') || str_starts_with($path, 'https://')) {
            return $path;
        }

        // If stored locally, copy to a new path
        if (Storage::disk('public')->exists($path)) {
            $extension = pathinfo($path, PATHINFO_EXTENSION);
            $newPath = $folder . '/' . uniqid() . '.' . $extension;
            if (Storage::disk('public')->copy($path, $newPath)) {
                return $newPath;
            }
        }

        return null;
    }
    /**
     * Add a question to a personal quiz.
     * For subject-based quizzes, coverage_id is required.
     * For custom quizzes, coverage_id is optional.
     */
    public function store(Request $request)
    {
        try {
            $user = Auth::user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized. Please log in to add questions.',
                ], 401);
            }

            // First, validate basic fields and check quiz type
            try {
                // Handle FormData - FormData sends everything as strings
                $requestData = $request->all();
                
                // Convert personalQuizID to integer if it's a string
                if (isset($requestData['personalQuizID']) && is_string($requestData['personalQuizID'])) {
                    $requestData['personalQuizID'] = (int) $requestData['personalQuizID'];
                }

                // Convert score to integer if it's a string
                if (isset($requestData['score']) && is_string($requestData['score'])) {
                    $requestData['score'] = (int) $requestData['score'];
                }

                // Handle coverage_id - convert empty string to null, or string to integer
                if (isset($requestData['coverage_id'])) {
                    if ($requestData['coverage_id'] === '' || $requestData['coverage_id'] === null) {
                        $requestData['coverage_id'] = null;
                    } elseif (is_string($requestData['coverage_id'])) {
                        $requestData['coverage_id'] = (int) $requestData['coverage_id'];
                    }
                } else {
                    $requestData['coverage_id'] = null;
                }

                $request->merge($requestData);

                // Clean questionText - remove HTML tags and check if it's actually empty
                if (isset($requestData['questionText'])) {
                    $cleanedText = strip_tags($requestData['questionText']);
                    $cleanedText = trim($cleanedText);
                    if (empty($cleanedText)) {
                        return response()->json([
                            'success' => false,
                            'message' => 'Validation failed. Please check your input.',
                            'errors' => [
                                'questionText' => ['Question text cannot be empty.']
                            ],
                        ], 422);
                    }
                }

                $validated = $request->validate([
                    'personalQuizID' => 'required|integer|exists:personal_quizzes,personalQuizID',
                    'questionText' => 'required|string',
                    'score' => 'required|integer|min:1',
                    'coverage_id' => 'nullable|integer|exists:coverages,id',
                    'image' => 'nullable|file|image|max:10240', // Max 10MB
                ]);
            } catch (ValidationException $e) {
                Log::warning('Validation failed for personal quiz question', [
                    'user_id' => optional(Auth::user())->userID,
                    'errors' => $e->errors(),
                    'request_data' => $request->all(),
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed. Please check your input.',
                    'errors' => $e->errors(),
                ], 422);
            }

            // Verify the quiz exists and belongs to the user
            $quiz = PersonalQuiz::with('quizType')->find($validated['personalQuizID']);
            
            if (!$quiz) {
                return response()->json([
                    'success' => false,
                    'message' => 'Personal quiz not found.',
                ], 404);
            }

            // Check permissions
            if ($quiz->created_by !== $user->userID && !in_array($user->roleID, [3, 4, 5])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Forbidden. You do not have permission to modify this quiz.',
                ], 403);
            }

            // Validate quiz type and related requirements
            $isSubjectBased = (int) $quiz->quiz_type_id === 1;
            $isCustom = (int) $quiz->quiz_type_id === 2;

            // For subject-based quizzes, ensure quiz has a subject
            if ($isSubjectBased && !$quiz->subjectID) {
                return response()->json([
                    'success' => false,
                    'message' => 'Subject-based quizzes must have a subject assigned.',
                ], 422);
            }

            // For subject-based quizzes, coverage_id is required. Fall back to the quiz's coverage_id.
            $coverageId = $validated['coverage_id'] ?? $quiz->coverage_id;
            if ($isSubjectBased && empty($coverageId)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Coverage is required for subject-based quizzes. Please select a coverage (e.g., Midterm, Finals).',
                    'errors' => [
                        'coverage_id' => ['Coverage is required for subject-based quizzes.']
                    ],
                ], 422);
            }

            // For custom quizzes, coverage_id should not be provided
            if ($isCustom && !empty($coverageId)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Coverage is not applicable for custom quizzes. Please remove the coverage field.',
                    'errors' => [
                        'coverage_id' => ['Coverage should not be provided for custom quizzes.']
                    ],
                ], 422);
            }

            // Handle image upload (reuse pattern from Questions controller)
            $imagePath = $this->handleImageUpload($request, 'image', 'question_images');

            // Prepare question data
            $quizQuestionData = [
                'personalQuizID' => $validated['personalQuizID'],
                'questionID' => null, // Not linked to existing question; this is manual entry
                'personalQuizSubjectID' => $quiz->subjectID, // for subject-based; null for custom
                'personalQuizUserID' => $user->userID, // creator
                'personalQuizQuestionText' => Crypt::encryptString($validated['questionText']),
                'personalQuizImage' => $imagePath,
                'personalQuizScore' => (int) $validated['score'], // Ensure it's an integer
                'personalQuizCoverageId' => $isSubjectBased ? $coverageId : null, // Only set for subject-based
            ];

            $quizQuestion = PersonalQuizQuestion::create($quizQuestionData);

            // Load relationships and format the question
            $quizQuestion->load(['personalQuiz', 'personalQuizSubject', 'personalQuizCoverage', 'personalQuizUser']);

            return response()->json([
                'success' => true,
                'message' => 'Question added to personal quiz successfully.',
                'quizQuestion' => $this->formatPersonalQuizQuestion($quizQuestion),
            ], 201);
        } catch (\Throwable $e) {
            Log::error('Error adding question to personal quiz', [
                'user_id' => optional(Auth::user())->userID,
                'payload' => $request->all(),
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An internal error occurred while adding the question.',
                'error' => app()->environment('local') ? $e->getMessage() : null,
                'file' => app()->environment('local') ? $e->getFile() : null,
                'line' => app()->environment('local') ? $e->getLine() : null,
            ], 500);
        }
    }

    /**
     * Import multiple questions from existing questions table into a personal quiz.
     * Accepts an array of questionIDs and imports them all at once.
     * Only copies fields that exist in both tables to preserve data uniformity.
     * For subject-based quizzes, coverage is copied from the original question.
     * For custom quizzes, coverage is set to null.
     */
    public function import(Request $request)
    {
        try {
            $user = Auth::user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized. Please log in to import questions.',
                ], 401);
            }

            try {
                $validated = $request->validate([
                    'personalQuizID' => 'required|exists:personal_quizzes,personalQuizID',
                    'questionIDs' => 'required|array|min:1',
                    'questionIDs.*' => 'required|exists:questions,questionID',
                ]);
            } catch (ValidationException $e) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed. Please check your input.',
                    'errors' => $e->errors(),
                ], 422);
            }

            // Verify the quiz exists and belongs to the user
            $quiz = PersonalQuiz::with('quizType')->find($validated['personalQuizID']);
            
            if (!$quiz) {
                return response()->json([
                    'success' => false,
                    'message' => 'Personal quiz not found.',
                ], 404);
            }

            // Check permissions
            if ($quiz->created_by !== $user->userID && !in_array($user->roleID, [3, 4, 5])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Forbidden. You do not have permission to modify this quiz.',
                ], 403);
            }

            // Validate quiz type and related requirements
            $isSubjectBased = (int) $quiz->quiz_type_id === 1;

            // For subject-based quizzes, ensure subject is set
            if ($isSubjectBased && !$quiz->subjectID) {
                return response()->json([
                    'success' => false,
                    'message' => 'Subject-based quizzes must have a subject assigned.',
                ], 422);
            }

            DB::beginTransaction();

            $added = [];
            $skipped = [];

            foreach ($validated['questionIDs'] as $questionID) {
                // Check if question already in quiz
                $existing = PersonalQuizQuestion::where('personalQuizID', $validated['personalQuizID'])
                    ->where('questionID', $questionID)
                    ->where('personalQuizUserID', $user->userID)
                    ->first();

                if ($existing) {
                    $skipped[] = $questionID;
                    continue;
                }

                $question = Question::with('choices')->find($questionID);
                if (!$question || $question->choices->isEmpty()) {
                    $skipped[] = $questionID;
                    continue;
                }

                // For subject-based quizzes, verify subject match
                if ($quiz->quiz_type_id == 1 && $quiz->subjectID) {
                    if ($question->subjectID !== $quiz->subjectID) {
                        $skipped[] = $questionID;
                        continue;
                    }
                }

                // Copy question data
                // For custom quizzes, coverage should be null; for subject-based, use question's coverage
                $quizQuestionData = [
                    'personalQuizID' => $validated['personalQuizID'],
                    'questionID' => $questionID,
                    'personalQuizSubjectID' => $question->subjectID,
                    'personalQuizUserID' => $user->userID,
                    'personalQuizQuestionText' => $question->questionText, // already encrypted in questions table
                    'personalQuizImage' => $this->copyImageIfNeeded($question->image, 'question_images'),
                    'personalQuizScore' => $question->score,
                    'personalQuizCoverageId' => $quiz->quiz_type_id == 1 ? $question->coverage_id : null, // Only for subject-based
                ];

                $quizQuestion = PersonalQuizQuestion::create($quizQuestionData);
                
                // Copy choices from the original question to personal quiz choices
                $this->copyChoicesToPersonalQuiz($question, $quizQuestion);
                
                // Load relationships and format the question
                $quizQuestion->load(['personalQuizChoices', 'personalQuizSubject', 'personalQuizCoverage', 'personalQuizUser']);
                $added[] = $this->formatPersonalQuizQuestion($quizQuestion);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => sprintf(
                    'Imported %d question(s). %d question(s) were skipped.',
                    count($added),
                    count($skipped)
                ),
                'added' => $added,
                'skipped' => $skipped,
                'added_count' => count($added),
                'skipped_count' => count($skipped),
            ], 201);
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Error importing questions to personal quiz', [
                'user_id' => optional(Auth::user())->userID,
                'payload' => $request->all(),
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An internal error occurred while importing questions.',
                'error' => app()->environment('local') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Update a question in a personal quiz.
     */
    public function update(Request $request, $personalQuizQuestionID)
    {
        try {
            $user = Auth::user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized',
                ], 401);
            }

            // Find the question
            $quizQuestion = PersonalQuizQuestion::with(['personalQuiz', 'personalQuizChoices'])
                ->find($personalQuizQuestionID);

            if (!$quizQuestion) {
                return response()->json([
                    'success' => false,
                    'message' => 'Personal quiz question not found.',
                ], 404);
            }

            // Verify ownership or permissions
            if ($quizQuestion->personalQuiz->created_by !== $user->userID && !in_array($user->roleID, [2, 3, 4, 5])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Forbidden. You do not have permission to update this question.',
                ], 403);
            }

            $quiz = $quizQuestion->personalQuiz;
            $isSubjectBased = (int) $quiz->quiz_type_id === 1;
            $isCustom = (int) $quiz->quiz_type_id === 2;

            // Handle FormData - convert strings to appropriate types
            $requestData = $request->all();
            
            // Convert coverage_id
            if (isset($requestData['coverage_id'])) {
                if ($requestData['coverage_id'] === '' || $requestData['coverage_id'] === null) {
                    $requestData['coverage_id'] = null;
                } elseif (is_string($requestData['coverage_id'])) {
                    $requestData['coverage_id'] = (int) $requestData['coverage_id'];
                }
            } else {
                $requestData['coverage_id'] = null;
            }

            // Convert score
            if (isset($requestData['score']) && is_string($requestData['score'])) {
                $requestData['score'] = (int) $requestData['score'];
            }

            // Handle question image - convert empty string to null
            if (isset($requestData['image']) && $requestData['image'] === '') {
                $requestData['image'] = null;
            }

            $request->merge($requestData);

            try {
                $validated = $request->validate([
                    'questionText' => 'sometimes|required|string',
                    'score' => 'sometimes|required|integer|min:1',
                    'coverage_id' => 'nullable|integer|exists:coverages,id',
                    'image' => 'nullable',
                ]);
            } catch (ValidationException $e) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $e->errors(),
                ], 422);
            }

            // Validate coverage based on quiz type. Fall back to quiz's coverage_id.
            $coverageId = $validated['coverage_id'] ?? $quizQuestion->personalQuizCoverageId ?? $quiz->coverage_id;
            if ($isSubjectBased && empty($coverageId)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Coverage is required for subject-based quizzes.',
                    'errors' => [
                        'coverage_id' => ['Coverage is required for subject-based quizzes.']
                    ],
                ], 422);
            }

            if ($isCustom && !empty($coverageId)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Coverage should not be provided for custom quizzes.',
                    'errors' => [
                        'coverage_id' => ['Coverage is not applicable for custom quizzes.']
                    ],
                ], 422);
            }

            DB::beginTransaction();

            try {
                // Update question text if provided
                if (isset($validated['questionText'])) {
                    // Clean questionText - remove HTML tags and check if it's actually empty
                    $cleanedText = strip_tags($validated['questionText']);
                    $cleanedText = trim($cleanedText);
                    if (empty($cleanedText) || $cleanedText === '<br>') {
                        DB::rollBack();
                        return response()->json([
                            'success' => false,
                            'message' => 'Question text cannot be empty.',
                            'errors' => [
                                'questionText' => ['Question text cannot be empty.']
                            ],
                        ], 422);
                    }
                    // Always encrypt and save the question text
                    $quizQuestion->personalQuizQuestionText = Crypt::encryptString($validated['questionText']);
                }

                // Update score if provided
                if (isset($validated['score'])) {
                    $quizQuestion->personalQuizScore = (int) $validated['score'];
                }

                // Update coverage if provided
                if (isset($validated['coverage_id'])) {
                    $quizQuestion->personalQuizCoverageId = $isSubjectBased ? $validated['coverage_id'] : null;
                }

                // Handle question image update
                $hasNewImage = false;
                if (isset($validated['image'])) {
                    if (filter_var($validated['image'], FILTER_VALIDATE_URL)) {
                        // If it's a URL, use it directly
                        $quizQuestion->personalQuizImage = $validated['image'];
                        $hasNewImage = true;
                    } elseif ($request->hasFile('image')) {
                        // Delete old image if exists (only if it's a stored file, not a URL)
                        if ($quizQuestion->personalQuizImage && 
                            !filter_var($quizQuestion->personalQuizImage, FILTER_VALIDATE_URL) &&
                            Storage::disk('public')->exists($quizQuestion->personalQuizImage)) {
                            Storage::disk('public')->delete($quizQuestion->personalQuizImage);
                        }
                        // Store the new image
                        $path = $request->file('image')->store('question_images', 'public');
                        $quizQuestion->personalQuizImage = $path;
                        $hasNewImage = true;
                    } elseif ($validated['image'] === null || $validated['image'] === '') {
                        // If image is explicitly set to null or empty, delete the existing image
                        if ($quizQuestion->personalQuizImage && 
                            !filter_var($quizQuestion->personalQuizImage, FILTER_VALIDATE_URL) &&
                            Storage::disk('public')->exists($quizQuestion->personalQuizImage)) {
                            Storage::disk('public')->delete($quizQuestion->personalQuizImage);
                        }
                        $quizQuestion->personalQuizImage = null;
                        $hasNewImage = true;
                    }
                }

                // Save the question
                $quizQuestion->save();

                DB::commit();

                // Reload the question with all relationships to ensure fresh data
                $quizQuestion->load([
                    'personalQuizChoices' => function($query) {
                        $query->orderBy('position', 'asc');
                    },
                    'personalQuiz',
                    'personalQuizSubject',
                    'personalQuizCoverage',
                    'personalQuizUser'
                ]);

                return response()->json([
                    'success' => true,
                    'message' => 'Question updated successfully.',
                    'quizQuestion' => $this->formatPersonalQuizQuestion($quizQuestion),
                ], 200);
            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }
        } catch (\Throwable $e) {
            Log::error('Error updating personal quiz question', [
                'user_id' => optional(Auth::user())->userID,
                'personal_quiz_question_id' => $personalQuizQuestionID,
                'payload' => $request->all(),
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An internal error occurred while updating the question.',
                'error' => app()->environment('local') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Duplicate a question from one quiz to another (or within the same quiz).
     * Copies the question and all its choices with proper image handling.
     * Allows optional edits to question text, image, score, coverage, and choices before importing.
     */
    public function duplicate(Request $request, $personalQuizQuestionID)
    {
        try {
            $user = Auth::user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized',
                ], 401);
            }

            // Handle FormData - convert strings to appropriate types
            $requestData = $request->all();
            
            // Convert coverage_id
            if (isset($requestData['coverage_id'])) {
                if ($requestData['coverage_id'] === '' || $requestData['coverage_id'] === null) {
                    $requestData['coverage_id'] = null;
                } elseif (is_string($requestData['coverage_id'])) {
                    $requestData['coverage_id'] = (int) $requestData['coverage_id'];
                }
            } else {
                $requestData['coverage_id'] = null;
            }

            // Convert score
            if (isset($requestData['score']) && is_string($requestData['score'])) {
                $requestData['score'] = (int) $requestData['score'];
            }

            // Handle choices isCorrect conversion
            if (isset($requestData['choices']) && is_array($requestData['choices'])) {
                foreach ($requestData['choices'] as $index => $choice) {
                    if (isset($choice['isCorrect'])) {
                        $isCorrectValue = $choice['isCorrect'];
                        if (is_string($isCorrectValue)) {
                            $lowerValue = strtolower(trim($isCorrectValue));
                            $requestData['choices'][$index]['isCorrect'] = in_array($lowerValue, ['true', '1', 'yes'], true);
                        } elseif (is_numeric($isCorrectValue)) {
                            $requestData['choices'][$index]['isCorrect'] = (bool) $isCorrectValue;
                        }
                    } else {
                        $requestData['choices'][$index]['isCorrect'] = false;
                    }

                    // Handle empty choiceText
                    if (isset($choice['choiceText']) && $choice['choiceText'] === '') {
                        $requestData['choices'][$index]['choiceText'] = null;
                    }
                }
            }

            $request->merge($requestData);

            try {
                $validated = $request->validate([
                    'targetPersonalQuizID' => 'required|exists:personal_quizzes,personalQuizID',
                    'questionText' => 'nullable|string',
                    'image' => 'nullable',
                    'score' => 'nullable|integer|min:1',
                    'coverage_id' => 'nullable|integer|exists:coverages,id',
                    'choices' => 'nullable|array|min:4|max:5',
                    'choices.*.choiceText' => 'nullable|string',
                    'choices.*.isCorrect' => 'required|boolean',
                    'choices.*.image' => 'nullable',
                ]);
            } catch (ValidationException $e) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $e->errors(),
                ], 422);
            }

            // Find the source question
            $sourceQuestion = PersonalQuizQuestion::with([
                'personalQuiz',
                'personalQuizChoices' => function($query) {
                    $query->orderBy('position', 'asc');
                }
            ])->find($personalQuizQuestionID);

            if (!$sourceQuestion) {
                return response()->json([
                    'success' => false,
                    'message' => 'Source question not found.',
                ], 404);
            }

            // Verify source quiz ownership or permissions
            if ($sourceQuestion->personalQuiz->created_by !== $user->userID && !in_array($user->roleID, [3, 4, 5])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Forbidden. You do not have permission to copy this question.',
                ], 403);
            }

            // Find and verify target quiz
            $targetQuiz = PersonalQuiz::with('quizType')->find($validated['targetPersonalQuizID']);
            
            if (!$targetQuiz) {
                return response()->json([
                    'success' => false,
                    'message' => 'Target quiz not found.',
                ], 404);
            }

            // Verify target quiz ownership or permissions
            if ($targetQuiz->created_by !== $user->userID && !in_array($user->roleID, [3, 4, 5])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Forbidden. You do not have permission to add questions to this quiz.',
                ], 403);
            }

            // Validate quiz types and coverage
            $isTargetSubjectBased = (int) $targetQuiz->quiz_type_id === 1;
            $isTargetCustom = (int) $targetQuiz->quiz_type_id === 2;

            // For subject-based target quiz, ensure subject is set
            if ($isTargetSubjectBased && !$targetQuiz->subjectID) {
                return response()->json([
                    'success' => false,
                    'message' => 'Target subject-based quiz must have a subject assigned.',
                ], 422);
            }

            // Determine coverage for target question
            $targetCoverageId = null;
            if ($isTargetSubjectBased) {
                // Use provided coverage_id or fall back to source question's coverage or target quiz's coverage
                $targetCoverageId = $validated['coverage_id'] ?? $sourceQuestion->personalQuizCoverageId ?? $targetQuiz->coverage_id;
                if (empty($targetCoverageId)) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Coverage is required for subject-based quizzes. Please provide a coverage_id or ensure the source question has a coverage.',
                        'errors' => [
                            'coverage_id' => ['Coverage is required for subject-based quizzes.']
                        ],
                    ], 422);
                }
            } else {
                // For custom quizzes, coverage should be null
                if (isset($validated['coverage_id']) && !empty($validated['coverage_id'])) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Coverage should not be provided for custom quizzes.',
                        'errors' => [
                            'coverage_id' => ['Coverage is not applicable for custom quizzes.']
                        ],
                    ], 422);
                }
            }

            DB::beginTransaction();

            try {
                // Decrypt source question text
                $sourceQuestionText = null;
                try {
                    if ($sourceQuestion->personalQuizQuestionText) {
                        $sourceQuestionText = Crypt::decryptString($sourceQuestion->personalQuizQuestionText);
                    }
                } catch (\Exception $e) {
                    DB::rollBack();
                    return response()->json([
                        'success' => false,
                        'message' => 'Failed to decrypt source question text.',
                    ], 500);
                }

                // Use edited question text if provided, otherwise use source
                $finalQuestionText = $validated['questionText'] ?? $sourceQuestionText;
                
                // Validate question text is not empty
                if (empty(trim(strip_tags($finalQuestionText ?? '')))) {
                    DB::rollBack();
                    return response()->json([
                        'success' => false,
                        'message' => 'Question text cannot be empty.',
                        'errors' => [
                            'questionText' => ['Question text cannot be empty.']
                        ],
                    ], 422);
                }

                // Handle question image - prioritize new upload, then edited URL, then copy original
                $newQuestionImage = null;
                if (isset($validated['image'])) {
                    if (filter_var($validated['image'], FILTER_VALIDATE_URL)) {
                        // If it's a URL, use it directly
                        $newQuestionImage = $validated['image'];
                    } elseif ($request->hasFile('image')) {
                        // If new image is being uploaded
                        $path = $request->file('image')->store('question_images', 'public');
                        $newQuestionImage = $path;
                    } elseif ($validated['image'] === null) {
                        // If image is explicitly set to null, don't copy image
                        $newQuestionImage = null;
                    }
                } else {
                    // No edit provided, copy original image
                    if ($sourceQuestion->personalQuizImage) {
                        $originalPath = $sourceQuestion->personalQuizImage;
                        // If it's a URL, keep it as is
                        if (filter_var($originalPath, FILTER_VALIDATE_URL)) {
                            $newQuestionImage = $originalPath;
                        }
                        // If it's a storage file, create a copy
                        elseif (Storage::disk('public')->exists($originalPath)) {
                            $extension = pathinfo($originalPath, PATHINFO_EXTENSION);
                            $newPath = 'question_images/' . uniqid() . '.' . $extension;
                            if (Storage::disk('public')->copy($originalPath, $newPath)) {
                                $newQuestionImage = $newPath;
                            }
                        }
                    }
                }

                // Use edited score if provided, otherwise use source
                $finalScore = $validated['score'] ?? $sourceQuestion->personalQuizScore;

                // Create new question
                $newQuestion = PersonalQuizQuestion::create([
                    'personalQuizID' => $validated['targetPersonalQuizID'],
                    'questionID' => $sourceQuestion->questionID, // Keep reference to original if it exists
                    'personalQuizSubjectID' => $targetQuiz->subjectID,
                    'personalQuizUserID' => $user->userID,
                    'personalQuizQuestionText' => Crypt::encryptString($finalQuestionText),
                    'personalQuizImage' => $newQuestionImage,
                    'personalQuizScore' => $finalScore,
                    'personalQuizCoverageId' => $targetCoverageId,
                ]);

                // Handle choices - use edited choices if provided, otherwise copy source choices
                $hasCorrectChoice = false;
                $position5Provided = false;
                $position5IsCorrect = false;
                
                if (isset($validated['choices']) && is_array($validated['choices'])) {
                    // Use edited choices - process all provided (up to 5, including position 5 if provided)
                    $sourceChoices = $sourceQuestion->personalQuizChoices->where('position', '!=', 5)->sortBy('position')->values();
                    $sourcePosition5 = $sourceQuestion->personalQuizChoices->where('position', 5)->first();
                    
                    // Ensure we have at least 4 choices (positions 1-4)
                    $choices1to4 = collect($validated['choices'])->filter(function($choice, $index) {
                        return ($index + 1) < 5;
                    })->values();
                    
                    if ($choices1to4->count() < 4) {
                        DB::rollBack();
                        return response()->json([
                            'success' => false,
                            'message' => 'At least 4 choices are required (positions 1-4).',
                        ], 422);
                    }

                    foreach ($validated['choices'] as $index => $choiceData) {
                        $position = $index + 1;
                        $isPosition5 = $position === 5;
                        
                        // If this is position 5, track it separately
                        if ($isPosition5) {
                            $position5Provided = true;
                            $position5IsCorrect = isset($choiceData['isCorrect']) ? (bool) $choiceData['isCorrect'] : false;
                            if ($position5IsCorrect) {
                                $hasCorrectChoice = true;
                            }
                            
                            // Create position 5 choice
                            PersonalQuizChoice::create([
                                'personalQuizQuestionID' => $newQuestion->personalQuizQuestionID,
                                'choiceText' => Crypt::encryptString('None of the above.'),
                                'isCorrect' => $position5IsCorrect,
                                'image' => null,
                                'position' => 5,
                            ]);
                            continue;
                        }
                        
                        // For positions 1-4, handle normally
                        // Get source choice for reference (for image copying if not edited)
                        $sourceChoice = $sourceChoices->get($index);
                        
                        // Use edited choice text if provided, otherwise use source
                        $finalChoiceText = null;
                        if (isset($choiceData['choiceText']) && $choiceData['choiceText'] !== null && $choiceData['choiceText'] !== '') {
                            $finalChoiceText = $choiceData['choiceText'];
                        } elseif ($sourceChoice && $sourceChoice->choiceText) {
                            try {
                                $finalChoiceText = Crypt::decryptString($sourceChoice->choiceText);
                            } catch (\Exception $e) {
                                // If decryption fails, use empty
                                $finalChoiceText = null;
                            }
                        }

                        // Handle choice image - prioritize new upload, then edited URL, then copy original
                        $newChoiceImage = null;
                        if (isset($choiceData['image'])) {
                            if (filter_var($choiceData['image'], FILTER_VALIDATE_URL)) {
                                $newChoiceImage = $choiceData['image'];
                            } elseif ($request->hasFile("choices.$index.image")) {
                                $stored = $request->file("choices.$index.image")->store('choices', 'public');
                                $newChoiceImage = $stored;
                            } elseif ($choiceData['image'] === null) {
                                $newChoiceImage = null;
                            }
                        } else {
                            // No edit provided, copy original image
                            if ($sourceChoice && $sourceChoice->image) {
                                $originalPath = $sourceChoice->image;
                                if (filter_var($originalPath, FILTER_VALIDATE_URL)) {
                                    $newChoiceImage = $originalPath;
                                } elseif (Storage::disk('public')->exists($originalPath)) {
                                    $extension = pathinfo($originalPath, PATHINFO_EXTENSION);
                                    $newPath = 'choices/' . uniqid() . '.' . $extension;
                                    if (Storage::disk('public')->copy($originalPath, $newPath)) {
                                        $newChoiceImage = $newPath;
                                    }
                                }
                            }
                        }

                        // Use edited isCorrect if provided, otherwise use source
                        $finalIsCorrect = isset($choiceData['isCorrect']) 
                            ? $choiceData['isCorrect'] 
                            : ($sourceChoice ? $sourceChoice->isCorrect : false);

                        // Create new choice
                        PersonalQuizChoice::create([
                            'personalQuizQuestionID' => $newQuestion->personalQuizQuestionID,
                            'choiceText' => $finalChoiceText ? Crypt::encryptString($finalChoiceText) : null,
                            'isCorrect' => $finalIsCorrect,
                            'image' => $newChoiceImage,
                            'position' => $position,
                        ]);

                        if ($finalIsCorrect) {
                            $hasCorrectChoice = true;
                        }
                    }
                } else {
                    // No edits provided, copy all source choices
                    $sourceChoices = $sourceQuestion->personalQuizChoices->where('position', '!=', 5)->sortBy('position');

                    foreach ($sourceChoices as $index => $sourceChoice) {
                        // Decrypt source choice text
                        $sourceChoiceText = null;
                        try {
                            if ($sourceChoice->choiceText) {
                                $sourceChoiceText = Crypt::decryptString($sourceChoice->choiceText);
                            }
                        } catch (\Exception $e) {
                            // If decryption fails, skip this choice
                            continue;
                        }

                        // Handle choice image
                        $newChoiceImage = null;
                        if ($sourceChoice->image) {
                            $originalPath = $sourceChoice->image;
                            // If it's a URL, keep it as is
                            if (filter_var($originalPath, FILTER_VALIDATE_URL)) {
                                $newChoiceImage = $originalPath;
                            }
                            // If it's a storage file, create a copy
                            elseif (Storage::disk('public')->exists($originalPath)) {
                                $extension = pathinfo($originalPath, PATHINFO_EXTENSION);
                                $newPath = 'choices/' . uniqid() . '.' . $extension;
                                if (Storage::disk('public')->copy($originalPath, $newPath)) {
                                    $newChoiceImage = $newPath;
                                }
                            }
                        }

                        // Create new choice
                        PersonalQuizChoice::create([
                            'personalQuizQuestionID' => $newQuestion->personalQuizQuestionID,
                            'choiceText' => $sourceChoiceText ? Crypt::encryptString($sourceChoiceText) : null,
                            'isCorrect' => $sourceChoice->isCorrect,
                            'image' => $newChoiceImage,
                            'position' => $index + 1,
                        ]);

                        if ($sourceChoice->isCorrect) {
                            $hasCorrectChoice = true;
                        }
                    }
                }

                // If position 5 was not provided in the request, auto-generate it
                if (!$position5Provided) {
                    PersonalQuizChoice::create([
                        'personalQuizQuestionID' => $newQuestion->personalQuizQuestionID,
                        'choiceText' => Crypt::encryptString('None of the above.'),
                        'isCorrect' => !$hasCorrectChoice,
                        'image' => null,
                        'position' => 5,
                    ]);
                    
                    // Update hasCorrectChoice if "None of the above" is correct
                    if (!$hasCorrectChoice) {
                        $hasCorrectChoice = true;
                    }
                }

                // Validate that at least one choice is marked as correct
                if (!$hasCorrectChoice) {
                    DB::rollBack();
                    return response()->json([
                        'success' => false,
                        'message' => 'At least one choice must be marked as correct.',
                    ], 422);
                }

                DB::commit();

                // Load the new question with all relationships
                $newQuestion->load([
                    'personalQuizChoices',
                    'personalQuiz',
                    'personalQuizSubject',
                    'personalQuizCoverage',
                    'personalQuizUser'
                ]);

                return response()->json([
                    'success' => true,
                    'message' => 'Question duplicated successfully.',
                    'quizQuestion' => $this->formatPersonalQuizQuestion($newQuestion),
                ], 201);
            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }
        } catch (\Throwable $e) {
            Log::error('Error duplicating personal quiz question', [
                'user_id' => optional(Auth::user())->userID,
                'personal_quiz_question_id' => $personalQuizQuestionID,
                'payload' => $request->all(),
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An internal error occurred while duplicating the question.',
                'error' => app()->environment('local') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Remove a question from a personal quiz.
     */
    public function destroy($personalQuizQuestionID)
    {
        try {
            $user = Auth::user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized',
                ], 401);
            }

            $quizQuestion = PersonalQuizQuestion::with('personalQuiz')->find($personalQuizQuestionID);

            if (!$quizQuestion) {
                return response()->json([
                    'success' => false,
                    'message' => 'Personal quiz question not found.',
                ], 404);
            }

            // Verify ownership or permissions
            if ($quizQuestion->personalQuiz->created_by !== $user->userID && !in_array($user->roleID, [3, 4, 5])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Forbidden. You do not have permission to remove this question.',
                ], 403);
            }

            $quizQuestion->delete();

            return response()->json([
                'success' => true,
                'message' => 'Question removed from personal quiz successfully.',
            ], 200);
        } catch (\Throwable $e) {
            Log::error('Error removing question from personal quiz', [
                'user_id' => optional(Auth::user())->userID,
                'personal_quiz_question_id' => $personalQuizQuestionID,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An error occurred while removing the question.',
            ], 500);
        }
    }

    // ============ PRIVATE HELPERS ============

    /**
     * Decrypt and format personal quiz question for display.
     * Similar to QuestionController::formatQuestion but adapted for personal quiz questions.
     */
    private function formatPersonalQuizQuestion($quizQuestion)
    {
        // Decrypt the question text
        try {
            if ($quizQuestion->personalQuizQuestionText) {
                $decryptedText = Crypt::decryptString($quizQuestion->personalQuizQuestionText);
                $quizQuestion->personalQuizQuestionText = $decryptedText;
                // Also add as questionText for frontend compatibility
                $quizQuestion->questionText = $decryptedText;
            }
        } catch (\Exception $e) {
            $quizQuestion->personalQuizQuestionText = '[Decryption Error]';
            $quizQuestion->questionText = '[Decryption Error]';
            Log::warning('Failed to decrypt personal quiz question text', [
                'question_id' => $quizQuestion->personalQuizQuestionID,
                'error' => $e->getMessage(),
            ]);
        }

        // Generate full URL for question image
        $quizQuestion->personalQuizImage = $this->generateUrl($quizQuestion->personalQuizImage);
        // Also add as image for frontend compatibility
        $quizQuestion->image = $quizQuestion->personalQuizImage;

        // Add creator name
        if ($quizQuestion->personalQuizUser) {
            $quizQuestion->creatorName = $quizQuestion->personalQuizUser->firstName . ' ' . $quizQuestion->personalQuizUser->lastName;
        }

        // Add subject information
        if ($quizQuestion->personalQuizSubject) {
            $quizQuestion->subjectCode = $quizQuestion->personalQuizSubject->subjectCode;
            $quizQuestion->subjectName = $quizQuestion->personalQuizSubject->subjectName;
        }

        // Add coverage information
        if ($quizQuestion->personalQuizCoverage) {
            $quizQuestion->coverageName = $quizQuestion->personalQuizCoverage->name;
        }

        // Format personal quiz choices (decrypt text, generate image URLs)
        if ($quizQuestion->personalQuizChoices && $quizQuestion->personalQuizChoices->isNotEmpty()) {
            $quizQuestion->personalQuizChoices->transform(function ($choice) {
                try {
                    if ($choice->choiceText) {
                        $choice->choiceText = Crypt::decryptString($choice->choiceText);
                    }
                } catch (\Exception $e) {
                    $choice->choiceText = '[Decryption Error]';
                    Log::warning('Failed to decrypt personal quiz choice text', [
                        'choice_id' => $choice->personalQuizChoiceID,
                        'error' => $e->getMessage(),
                    ]);
                }
                $choice->image = $this->generateUrl($choice->image);
                return $choice;
            });
            
            // Also add as choices for frontend compatibility
            $quizQuestion->choices = $quizQuestion->personalQuizChoices;
        } else {
            // Ensure choices is always an array, even if empty
            $quizQuestion->choices = collect([]);
        }

        // If this question is linked to an original question (imported), also include reference info
        if ($quizQuestion->questionID && $quizQuestion->question) {
            // Decrypt the original question text if needed (for reference)
            try {
                if ($quizQuestion->question->questionText) {
                    $quizQuestion->question->questionText = Crypt::decryptString($quizQuestion->question->questionText);
                }
            } catch (\Exception $e) {
                $quizQuestion->question->questionText = '[Decryption Error]';
            }

            // Generate URL for original question image
            $quizQuestion->question->image = $this->generateUrl($quizQuestion->question->image);
        }

        return $quizQuestion;
    }

    /**
     * Copy choices from an original question to a personal quiz question.
     * This is used when importing questions from the main questions table.
     *
     * @param Question $originalQuestion
     * @param PersonalQuizQuestion $quizQuestion
     * @return void
     */
    private function copyChoicesToPersonalQuiz($originalQuestion, $quizQuestion)
    {
        if (!$originalQuestion->choices || $originalQuestion->choices->isEmpty()) {
            return;
        }

        $hasCorrectChoice = false;

        foreach ($originalQuestion->choices as $originalChoice) {
            // Skip "None of the above" choice (position 5) - we'll add it at the end
            if ($originalChoice->position == 5) {
                continue;
            }

            // Copy choice image if it exists
            $imagePath = $this->copyImageIfNeeded($originalChoice->image, 'choices');

            // Create personal quiz choice
            PersonalQuizChoice::create([
                'personalQuizQuestionID' => $quizQuestion->personalQuizQuestionID,
                'choiceText' => $originalChoice->choiceText, // Already encrypted in choices table
                'isCorrect' => $originalChoice->isCorrect,
                'image' => $imagePath,
                'position' => $originalChoice->position,
            ]);

            if ($originalChoice->isCorrect) {
                $hasCorrectChoice = true;
            }
        }

        // Add "None of the above" choice (position 5)
        PersonalQuizChoice::create([
            'personalQuizQuestionID' => $quizQuestion->personalQuizQuestionID,
            'choiceText' => Crypt::encryptString('None of the above.'),
            'isCorrect' => !$hasCorrectChoice,
            'image' => null,
            'position' => 5,
        ]);
    }

    /**
     * Generate a full URL for images stored in the public disk.
     * Similar to QuestionController::generateUrl.
     */
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


