<?php

namespace Modules\PersonalExams\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Modules\PersonalExams\Models\PersonalQuiz;

class PersonalQuizController extends Controller
{
    /**
     * List personal quizzes created by the authenticated user.
     * Users can only see their own personal quizzes.
     */
    public function index()
    {
        try {
            $user = Auth::user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized',
                ], 401);
            }

            // Explicitly filter to only show quizzes created by the authenticated user
            $quizzes = PersonalQuiz::with(['subject', 'quizType', 'coverage', 'creator'])
                ->where('created_by', $user->userID)
                ->where('isArchived', false)
                ->orderByDesc('created_at')
                ->get();

            return response()->json([
                'success' => true,
                'message' => 'Personal quizzes retrieved successfully.',
                'quizzes' => $quizzes,
                'total' => $quizzes->count(),
            ], 200);
        } catch (\Throwable $e) {
            Log::error('Error listing personal quizzes', [
                'user_id' => optional(Auth::user())->userID,
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An error occurred while retrieving personal quizzes.',
                'error' => app()->environment('local') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Store a personalized quiz.
     * Supports subject-specific (subjectID provided) or fully customized (subjectID null).
     */
    public function store(Request $request)
    {
        try {
            $user = Auth::user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized',
                ], 401);
            }

            try {
                $validated = $request->validate([
                    'title' => 'required|string|max:255',
                    'description' => 'nullable|string',
                    'instruction' => 'nullable|string',
                    'quiz_type_id' => 'required|exists:quiz_types,id',
                    'subjectID' => 'nullable|exists:subjects,subjectID',
                    'coverage_id' => 'nullable|exists:coverages,id',
                ]);
            } catch (ValidationException $e) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $e->errors(),
                ], 422);
            }

            // Business rule: subject-based quiz must have a subjectID
            if ((int) ($validated['quiz_type_id'] ?? 0) === 1 && empty($validated['subjectID'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Please select a subject for a subject-based quiz.',
                ], 422);
            }

            $quiz = PersonalQuiz::create([
                ...$validated,
                'created_by' => $user->userID,
                // Ensure newly created quizzes are active by default regardless of DB default
                'isArchived' => false,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Personal quiz created successfully.',
                'quiz' => $quiz,
            ], 201);
        } catch (\Throwable $e) {
            Log::error('Error creating personal quiz', [
                'user_id' => optional(Auth::user())->userID,
                'payload' => $request->all(),
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An internal error occurred while creating the personal quiz.',
                'error' => app()->environment('local') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Update a personalized quiz.
     */
    public function update(Request $request, $personalQuizID)
    {
        try {
            $user = Auth::user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized',
                ], 401);
            }

            $quiz = PersonalQuiz::where('personalQuizID', $personalQuizID)
                ->where('created_by', $user->userID)
                ->first();

            if (!$quiz) {
                return response()->json([
                    'success' => false,
                    'message' => 'Personal quiz not found.',
                ], 404);
            }

            try {
                $validated = $request->validate([
                    'title' => 'sometimes|required|string|max:255',
                    'description' => 'nullable|string',
                    'instruction' => 'nullable|string',
                    'quiz_type_id' => 'sometimes|required|exists:quiz_types,id',
                    'subjectID' => 'nullable|exists:subjects,subjectID',
                    'coverage_id' => 'nullable|exists:coverages,id',
                ]);
            } catch (ValidationException $e) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $e->errors(),
                ], 422);
            }

            // Business rule: if quiz_type_id is being changed/kept as subject-based (1),
            // ensure subjectID is present
            $newQuizTypeId = $validated['quiz_type_id'] ?? $quiz->quiz_type_id;
            $newSubjectId = $validated['subjectID'] ?? $quiz->subjectID;

            if ((int) $newQuizTypeId === 1 && empty($newSubjectId)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Please select a subject for a subject-based quiz.',
                ], 422);
            }

            $quiz->update($validated);

            return response()->json([
                'success' => true,
                'message' => 'Personal quiz updated successfully.',
                'quiz' => $quiz,
            ], 200);
        } catch (\Throwable $e) {
            Log::error('Error updating personal quiz', [
                'user_id' => optional(Auth::user())->userID,
                'personal_quiz_id' => $personalQuizID,
                'payload' => $request->all(),
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An internal error occurred while updating the personal quiz.',
                'error' => app()->environment('local') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Archive a personal quiz.
     * Only the owner can archive their quiz.
     */
    public function archive($personalQuizID)
    {
        try {
            $user = Auth::user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized',
                ], 401);
            }

            $quiz = PersonalQuiz::where('personalQuizID', $personalQuizID)
                ->where('created_by', $user->userID)
                ->first();

            if (!$quiz) {
                return response()->json([
                    'success' => false,
                    'message' => 'Personal quiz not found.',
                ], 404);
            }

            if ($quiz->isArchived) {
                return response()->json([
                    'success' => true,
                    'message' => 'Personal quiz is already archived.',
                    'quiz' => $quiz,
                ], 200);
            }

            $quiz->isArchived = true;
            $quiz->save();

            return response()->json([
                'success' => true,
                'message' => 'Personal quiz archived successfully.',
                'quiz' => $quiz,
            ], 200);
        } catch (\Throwable $e) {
            Log::error('Error archiving personal quiz', [
                'user_id' => optional(Auth::user())->userID,
                'personal_quiz_id' => $personalQuizID,
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An internal error occurred while archiving the personal quiz.',
                'error' => app()->environment('local') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * List archived personal quizzes created by the authenticated user.
     * Only shows quizzes owned by the current user.
     */
    public function archived()
    {
        try {
            $user = Auth::user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized',
                ], 401);
            }

            $quizzes = PersonalQuiz::with(['subject', 'quizType', 'coverage', 'creator'])
                ->where('created_by', $user->userID)
                ->where('isArchived', true)
                ->orderByDesc('updated_at')
                ->get();

            return response()->json([
                'success' => true,
                'message' => 'Archived personal quizzes retrieved successfully.',
                'quizzes' => $quizzes,
                'total' => $quizzes->count(),
            ], 200);
        } catch (\Throwable $e) {
            Log::error('Error listing archived personal quizzes', [
                'user_id' => optional(Auth::user())->userID,
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An error occurred while retrieving archived personal quizzes.',
                'error' => app()->environment('local') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Unarchive a personal quiz.
     * Only the owner can unarchive their quiz.
     */
    public function unarchive($personalQuizID)
    {
        try {
            $user = Auth::user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized',
                ], 401);
            }

            $quiz = PersonalQuiz::where('personalQuizID', $personalQuizID)
                ->where('created_by', $user->userID)
                ->first();

            if (!$quiz) {
                return response()->json([
                    'success' => false,
                    'message' => 'Personal quiz not found.',
                ], 404);
            }

            if (!$quiz->isArchived) {
                return response()->json([
                    'success' => true,
                    'message' => 'Personal quiz is already active.',
                    'quiz' => $quiz,
                ], 200);
            }

            $quiz->isArchived = false;
            $quiz->save();

            return response()->json([
                'success' => true,
                'message' => 'Personal quiz unarchived successfully.',
                'quiz' => $quiz,
            ], 200);
        } catch (\Throwable $e) {
            Log::error('Error unarchiving personal quiz', [
                'user_id' => optional(Auth::user())->userID,
                'personal_quiz_id' => $personalQuizID,
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An internal error occurred while unarchiving the personal quiz.',
                'error' => app()->environment('local') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Permanently delete a personal quiz.
     * Can only be deleted if it is archived.
     */
    public function destroy($personalQuizID)
    {
        try {
            $user = Auth::user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized',
                ], 401);
            }

            $quiz = PersonalQuiz::where('personalQuizID', $personalQuizID)
                ->where('created_by', $user->userID)
                ->first();

            if (!$quiz) {
                return response()->json([
                    'success' => false,
                    'message' => 'Personal quiz not found.',
                ], 404);
            }

            if (!$quiz->isArchived) {
                return response()->json([
                    'success' => false,
                    'message' => 'Personal quiz must be archived before it can be deleted.',
                ], 422);
            }

            $quiz->delete();

            return response()->json([
                'success' => true,
                'message' => 'Personal quiz deleted successfully.',
            ], 200);
        } catch (\Throwable $e) {
            Log::error('Error deleting personal quiz', [
                'user_id' => optional(Auth::user())->userID,
                'personal_quiz_id' => $personalQuizID,
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An internal error occurred while deleting the personal quiz.',
                'error' => app()->environment('local') ? $e->getMessage() : null,
            ], 500);
        }
    }
}

