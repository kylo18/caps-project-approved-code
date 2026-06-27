<?php

namespace Modules\PersonalExams\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Validation\ValidationException;
use Modules\PersonalExams\Models\PersonalQuizChoice;
use Modules\PersonalExams\Models\PersonalQuizQuestion;

class PersonalQuizChoiceController extends Controller
{
    /**
     * Store choices for a personal quiz question.
     * Typically 4 manual choices + 1 automatic "None of the above".
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request)
    {
        try {
            $user = Auth::user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized. Please log in to add choices.',
                ], 401);
            }

            // Only Instructor, Program Chair, Dean can add choices
            if (!in_array($user->roleID, [2, 3, 4, 5])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Forbidden. You do not have permission to add choices.',
                ], 403);
            }

            try {
                // Handle FormData - FormData sends everything as strings
                $requestData = $request->all();
                
                // Convert personalQuizQuestionID to integer if it's a string
                if (isset($requestData['personalQuizQuestionID']) && is_string($requestData['personalQuizQuestionID'])) {
                    $requestData['personalQuizQuestionID'] = (int) $requestData['personalQuizQuestionID'];
                }

                // Convert isCorrect from string "true"/"false" to boolean for each choice
                // Laravel parses FormData nested arrays like choices[0][isCorrect] into choices[0]['isCorrect']
                if (isset($requestData['choices']) && is_array($requestData['choices'])) {
                    foreach ($requestData['choices'] as $index => $choice) {
                        if (isset($choice['isCorrect'])) {
                            $isCorrectValue = $choice['isCorrect'];
                            // Handle string "true"/"false", "1"/"0", or actual boolean
                            if (is_string($isCorrectValue)) {
                                $lowerValue = strtolower(trim($isCorrectValue));
                                $requestData['choices'][$index]['isCorrect'] = in_array($lowerValue, ['true', '1', 'yes'], true);
                            } elseif (is_numeric($isCorrectValue)) {
                                $requestData['choices'][$index]['isCorrect'] = (bool) $isCorrectValue;
                            }
                            // If it's already a boolean, leave it as is
                        } else {
                            // Default to false if not provided
                            $requestData['choices'][$index]['isCorrect'] = false;
                        }

                        // Handle empty choiceText - convert to null
                        if (isset($choice['choiceText']) && $choice['choiceText'] === '') {
                            $requestData['choices'][$index]['choiceText'] = null;
                        }
                    }
                }

                $request->merge($requestData);

                $validated = $request->validate([
                    'personalQuizQuestionID' => 'required|integer|exists:personal_quiz_questions,personalQuizQuestionID',
                    'choices' => 'required|array|min:4|max:5',
                    'choices.*.choiceText' => 'nullable|string',
                    'choices.*.isCorrect' => 'required|boolean',
                    'choices.*.image' => 'nullable',
                ], [
                    'choices.*.isCorrect.required' => 'Each choice must specify if it is correct or not.',
                    'choices.*.isCorrect.boolean' => 'The isCorrect field must be true or false.',
                ]);

                // Additional validation: Each choice must have either text or image
                foreach ($validated['choices'] as $index => $choice) {
                    $hasText = !empty($choice['choiceText']);
                    $hasImage = $request->hasFile("choices.$index.image") || 
                               (isset($choice['image']) && !empty($choice['image']) && filter_var($choice['image'], FILTER_VALIDATE_URL));
                    
                    if (!$hasText && !$hasImage) {
                        return response()->json([
                            'success' => false,
                            'message' => 'Validation failed. Please check your input.',
                            'errors' => [
                                "choices.$index.choiceText" => ['Each choice must have either text or an image.']
                            ],
                        ], 422);
                    }
                }
            } catch (ValidationException $e) {
                Log::warning('Validation failed for personal quiz choices', [
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

            // Verify the question exists and user has permission
            $question = PersonalQuizQuestion::with('personalQuiz')->find($validated['personalQuizQuestionID']);
            
            if (!$question) {
                return response()->json([
                    'success' => false,
                    'message' => 'Personal quiz question not found.',
                ], 404);
            }

            // Check permissions
            if ($question->personalQuiz->created_by !== $user->userID && !in_array($user->roleID, [3, 4, 5])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Forbidden. You do not have permission to modify this question.',
                ], 403);
            }

            DB::beginTransaction();

            try {
                $choices = [];
                $hasCorrectChoice = false;

                // Process all choices
                foreach ($validated['choices'] as $index => $choiceData) {
                    $imagePath = null;

                    // Store uploaded image if provided
                    if (isset($choiceData['image'])) {
                        if (filter_var($choiceData['image'], FILTER_VALIDATE_URL)) {
                            $imagePath = $choiceData['image'];
                        } elseif ($request->hasFile("choices.$index.image")) {
                            $storedPath = $request->file("choices.$index.image")->store('choices', 'public');
                            $imagePath = $storedPath;
                        }
                    }

                    // Encrypt choice text if provided
                    $encryptedChoiceText = null;
                    if (isset($choiceData['choiceText']) && strlen($choiceData['choiceText']) > 0) {
                        $encryptedChoiceText = Crypt::encryptString($choiceData['choiceText']);
                    }

                    if ($choiceData['isCorrect']) {
                        $hasCorrectChoice = true;
                    }

                    $choice = PersonalQuizChoice::create([
                        'personalQuizQuestionID' => $validated['personalQuizQuestionID'],
                        'choiceText' => $encryptedChoiceText,
                        'isCorrect' => $choiceData['isCorrect'],
                        'image' => $imagePath,
                        'position' => $index + 1,
                    ]);

                    $choices[] = $choice;
                }

                // Add "None of the above" if not already present (5th choice)
                if (count($choices) === 4) {
                    $noneChoice = PersonalQuizChoice::create([
                        'personalQuizQuestionID' => $validated['personalQuizQuestionID'],
                        'choiceText' => Crypt::encryptString('None of the above.'),
                        'isCorrect' => !$hasCorrectChoice,
                        'image' => null,
                        'position' => 5,
                    ]);
                    $choices[] = $noneChoice;
                }

                // Validate that at least one choice is marked as correct
                if (!$hasCorrectChoice && count($choices) === 4) {
                    DB::rollBack();
                    return response()->json([
                        'success' => false,
                        'message' => 'At least one choice must be marked as correct.',
                    ], 422);
                }

                DB::commit();

                // Format choices before returning
                $formattedChoices = collect($choices)->map(function ($choice) {
                    return $this->formatChoice($choice);
                })->sortBy('position')->values();

                return response()->json([
                    'success' => true,
                    'message' => 'Choices created successfully.',
                    'choices' => $formattedChoices,
                ], 201);
            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }
        } catch (\Throwable $e) {
            Log::error('Error creating personal quiz choices', [
                'user_id' => optional(Auth::user())->userID,
                'payload' => $request->all(),
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An internal error occurred while creating choices.',
            ], 500);
        }
    }

    /**
     * Update choices for a personal quiz question.
     * Handles FormData with proper type conversions.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function updateChoices(Request $request)
    {
        try {
            $user = Auth::user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized. Please log in to update choices.',
                ], 401);
            }

            if (!in_array($user->roleID, [2, 3, 4, 5])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Forbidden. You do not have permission to update choices.',
                ], 403);
            }

            // Handle FormData - convert strings to appropriate types
            $requestData = $request->all();
            
            // Convert personalQuizQuestionID to integer if it's a string
            if (isset($requestData['personalQuizQuestionID']) && is_string($requestData['personalQuizQuestionID'])) {
                $requestData['personalQuizQuestionID'] = (int) $requestData['personalQuizQuestionID'];
            }

            // Process choices array from FormData
            if (isset($requestData['choices']) && is_array($requestData['choices'])) {
                foreach ($requestData['choices'] as $index => $choice) {
                    // Convert isCorrect from string "1"/"0" to boolean
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

                    // Convert empty strings to null for choiceText
                    if (isset($choice['choiceText']) && $choice['choiceText'] === '') {
                        $requestData['choices'][$index]['choiceText'] = null;
                    }

                    // Convert empty strings to null for image
                    if (isset($choice['image']) && $choice['image'] === '') {
                        $requestData['choices'][$index]['image'] = null;
                    }

                    // Convert personalQuizChoiceID to integer if it's a string
                    if (isset($choice['personalQuizChoiceID']) && is_string($choice['personalQuizChoiceID'])) {
                        $requestData['choices'][$index]['personalQuizChoiceID'] = (int) $choice['personalQuizChoiceID'];
                    }
                }
            }

            $request->merge($requestData);

            try {
                $validated = $request->validate([
                    'personalQuizQuestionID' => 'required|integer|exists:personal_quiz_questions,personalQuizQuestionID',
                    'choices' => 'required|array|min:4|max:5',
                    'choices.*.personalQuizChoiceID' => 'nullable|integer|exists:personal_quiz_choices,personalQuizChoiceID',
                    'choices.*.choiceText' => 'nullable|string',
                    'choices.*.isCorrect' => 'required|boolean',
                    'choices.*.image' => 'nullable',
                ]);
            } catch (ValidationException $e) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed. Please check your input.',
                    'errors' => $e->errors(),
                ], 422);
            }

            // Verify the question exists and user has permission
            $question = PersonalQuizQuestion::with('personalQuiz')->find($validated['personalQuizQuestionID']);
            
            if (!$question) {
                return response()->json([
                    'success' => false,
                    'message' => 'Personal quiz question not found.',
                ], 404);
            }

            // Check permissions
            if ($question->personalQuiz->created_by !== $user->userID && !in_array($user->roleID, [3, 4, 5])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Forbidden. You do not have permission to modify this question.',
                ], 403);
            }

            DB::beginTransaction();

            try {
                $hasCorrectChoice = false;
                $position5Provided = false;
                $position5IsCorrect = false;
                
                // Process all choices provided (up to 5, including position 5 if provided)
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
                    }
                    
                    $choice = null;
                    
                    // Try to find by personalQuizChoiceID first
                    if (isset($choiceData['personalQuizChoiceID']) && !empty($choiceData['personalQuizChoiceID'])) {
                        $choice = PersonalQuizChoice::find($choiceData['personalQuizChoiceID']);
                    }

                    // If not found, try to find by position
                    if (!$choice) {
                        $choice = PersonalQuizChoice::where('personalQuizQuestionID', $validated['personalQuizQuestionID'])
                            ->where('position', $position)
                            ->first();
                    }

                    // If still not found, create new one
                    if (!$choice) {
                        $choice = new PersonalQuizChoice();
                        $choice->personalQuizQuestionID = $validated['personalQuizQuestionID'];
                    }

                    // For position 5 ("None of the above"), always set text and no image
                    if ($isPosition5) {
                        $choice->choiceText = Crypt::encryptString('None of the above.');
                        $choice->image = null;
                        $choice->isCorrect = $position5IsCorrect;
                    } else {
                        // For positions 1-4, handle normally
                        // Always update choice text (encrypt if provided, set to null if empty)
                        if (isset($choiceData['choiceText'])) {
                            $choiceText = trim($choiceData['choiceText']);
                            $choice->choiceText = !empty($choiceText)
                                ? Crypt::encryptString($choiceText)
                                : null;
                        }

                        // Always update isCorrect
                        $choice->isCorrect = isset($choiceData['isCorrect']) ? (bool) $choiceData['isCorrect'] : false;
                        
                        if ($choice->isCorrect) {
                            $hasCorrectChoice = true;
                        }

                        // Handle choice image. Use array_key_exists (NOT isset): the
                        // empty string sent when an image is removed is converted to null
                        // above, and isset() is false for null — which previously skipped
                        // this whole block and left the old picture in place. array_key_exists
                        // is true for a present-but-null key, so the "removed" branch runs.
                        if (array_key_exists('image', $choiceData) || $request->hasFile("choices.$index.image")) {
                            if (filter_var($choiceData['image'], FILTER_VALIDATE_URL)) {
                                // It's a URL, use it directly
                                $choice->image = $choiceData['image'];
                            } elseif ($request->hasFile("choices.$index.image")) {
                                // New file uploaded
                                // Delete old image if exists (only if it's a stored file, not a URL)
                                if ($choice->image && 
                                    !filter_var($choice->image, FILTER_VALIDATE_URL) &&
                                    Storage::disk('public')->exists($choice->image)) {
                                    Storage::disk('public')->delete($choice->image);
                                }
                                $stored = $request->file("choices.$index.image")->store('choices', 'public');
                                $choice->image = $stored;
                            } elseif ($choiceData['image'] === null || $choiceData['image'] === '') {
                                // Image explicitly removed
                                if ($choice->image && 
                                    !filter_var($choice->image, FILTER_VALIDATE_URL) &&
                                    Storage::disk('public')->exists($choice->image)) {
                                    Storage::disk('public')->delete($choice->image);
                                }
                                $choice->image = null;
                            }
                            // If image is not set in choiceData, keep existing image
                        }
                    }

                    $choice->position = $position;
                    $choice->save();
                }

                // If position 5 was not provided in the request, auto-generate it
                if (!$position5Provided) {
                    $noneChoice = PersonalQuizChoice::where('personalQuizQuestionID', $validated['personalQuizQuestionID'])
                        ->where('position', 5)
                        ->first();
                    
                    if (!$noneChoice) {
                        $noneChoice = new PersonalQuizChoice();
                        $noneChoice->personalQuizQuestionID = $validated['personalQuizQuestionID'];
                        $noneChoice->position = 5;
                    }
                    
                    $noneChoice->choiceText = Crypt::encryptString('None of the above.');
                    $noneChoice->isCorrect = !$hasCorrectChoice;
                    $noneChoice->image = null;
                    $noneChoice->save();
                    
                    // Update hasCorrectChoice if "None of the above" is correct
                    if ($noneChoice->isCorrect) {
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

                // Load and format updated choices
                $updatedChoices = PersonalQuizChoice::where('personalQuizQuestionID', $validated['personalQuizQuestionID'])
                    ->orderBy('position')
                    ->get()
                    ->map(function ($choice) {
                        return $this->formatChoice($choice);
                    });

                return response()->json([
                    'success' => true,
                    'message' => 'Choices updated successfully.',
                    'choices' => $updatedChoices,
                ], 200);
            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }
        } catch (\Throwable $e) {
            Log::error('Error updating personal quiz choices', [
                'user_id' => optional(Auth::user())->userID,
                'payload' => $request->all(),
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An internal error occurred while updating choices.',
            ], 500);
        }
    }

    /**
     * Show choices for a specific personal quiz question.
     *
     * @param int $personalQuizQuestionID
     * @return \Illuminate\Http\JsonResponse
     */
    public function show($personalQuizQuestionID)
    {
        try {
            $user = Auth::user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized. Please log in to view choices.',
                ], 401);
            }

            // Verify the question exists
            $question = PersonalQuizQuestion::with('personalQuiz')->find($personalQuizQuestionID);
            
            if (!$question) {
                return response()->json([
                    'success' => false,
                    'message' => 'Personal quiz question not found.',
                ], 404);
            }

            // Check permissions
            if ($question->personalQuiz->created_by !== $user->userID && !in_array($user->roleID, [3, 4, 5])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Forbidden. You do not have permission to view this question.',
                ], 403);
            }

            $choices = PersonalQuizChoice::where('personalQuizQuestionID', $personalQuizQuestionID)
                ->orderBy('position')
                ->get()
                ->map(function ($choice) {
                    return $this->formatChoice($choice);
                });

            return response()->json([
                'success' => true,
                'message' => 'Choices retrieved successfully.',
                'choices' => $choices,
            ], 200);
        } catch (\Throwable $e) {
            Log::error('Error retrieving personal quiz choices', [
                'user_id' => optional(Auth::user())->userID,
                'personal_quiz_question_id' => $personalQuizQuestionID,
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An error occurred while retrieving choices.',
            ], 500);
        }
    }

    /**
     * Delete a choice and remove its image from storage (if exists).
     *
     * @param int $personalQuizChoiceID
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy($personalQuizChoiceID)
    {
        try {
            $user = Auth::user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized. Please log in to delete choices.',
                ], 401);
            }

            if (!in_array($user->roleID, [2, 3, 4, 5])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Forbidden. You do not have permission to delete choices.',
                ], 403);
            }

            $choice = PersonalQuizChoice::with('personalQuizQuestion.personalQuiz')->find($personalQuizChoiceID);

            if (!$choice) {
                return response()->json([
                    'success' => false,
                    'message' => 'Personal quiz choice not found.',
                ], 404);
            }

            // Check permissions
            if ($choice->personalQuizQuestion->personalQuiz->created_by !== $user->userID && !in_array($user->roleID, [3, 4, 5])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Forbidden. You do not have permission to delete this choice.',
                ], 403);
            }

            // Delete stored image if present
            if ($choice->image && Storage::disk('public')->exists($choice->image)) {
                Storage::disk('public')->delete($choice->image);
            }

            $choice->delete();

            return response()->json([
                'success' => true,
                'message' => 'Choice deleted successfully.',
            ], 200);
        } catch (\Throwable $e) {
            Log::error('Error deleting personal quiz choice', [
                'user_id' => optional(Auth::user())->userID,
                'personal_quiz_choice_id' => $personalQuizChoiceID,
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An error occurred while deleting the choice.',
            ], 500);
        }
    }

    // ============ PRIVATE HELPERS ============

    /**
     * Format choice for display (decrypt text, generate image URL).
     *
     * @param PersonalQuizChoice $choice
     * @return PersonalQuizChoice
     */
    private function formatChoice($choice)
    {
        // Decrypt choice text
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

        // Generate full URL for image
        $choice->image = $this->generateUrl($choice->image);

        return $choice;
    }

    /**
     * Generate a full URL for images stored in the public disk.
     *
     * @param string|null $path
     * @return string|null
     */
    private function generateUrl($path)
    {
        if (!$path) {
            return null;
        }

        // If it's already a full URL, return as is
        if (filter_var($path, FILTER_VALIDATE_URL)) {
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

