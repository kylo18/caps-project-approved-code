<?php

namespace Modules\PersonalExams\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Modules\PersonalExams\Models\PersonalQuiz;
use Modules\PersonalExams\Models\PersonalQuizSetting;

class PersonalQuizSettingController extends Controller
{
    /**
     * Get configuration for a specific personal quiz.
     */
    public function show($personalQuizID)
    {
        try {
            $user = Auth::user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized',
                ], 401);
            }

            // Verify the quiz belongs to the user
            $quiz = PersonalQuiz::where('personalQuizID', $personalQuizID)
                ->where('created_by', $user->userID)
                ->first();

            if (!$quiz) {
                return response()->json([
                    'success' => false,
                    'message' => 'Personal quiz not found or you do not have permission.',
                ], 404);
            }

            // Get or create settings
            $setting = PersonalQuizSetting::firstOrCreate(
                ['personalQuizID' => $personalQuizID],
                [
                    'quizTimerEnabled' => false,
                    'shuffleQuestions' => false,
                    'shuffleChoices' => false,
                    'showCorrectAnswers' => false,
                    'showCorrectQuestion' => false,
                    'autoSubmitOnTimeout' => false,
                    'allowLateSubmission' => false,
                    'showScoreAfterQuiz' => false,
                ]
            );

            return response()->json([
                'success' => true,
                'message' => 'Quiz settings retrieved successfully.',
                'setting' => $setting,
            ], 200);
        } catch (\Throwable $e) {
            Log::error('Error retrieving quiz settings', [
                'user_id' => optional(Auth::user())->userID,
                'personal_quiz_id' => $personalQuizID,
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An error occurred while retrieving quiz settings.',
                'error' => app()->environment('local') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Create or update configuration for a personal quiz.
     */
    public function store(Request $request, $personalQuizID)
    {
        try {
            $user = Auth::user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized',
                ], 401);
            }

            // Verify the quiz belongs to the user
            $quiz = PersonalQuiz::where('personalQuizID', $personalQuizID)
                ->where('created_by', $user->userID)
                ->first();

            if (!$quiz) {
                return response()->json([
                    'success' => false,
                    'message' => 'Personal quiz not found or you do not have permission.',
                ], 404);
            }

            try {
                $validated = $request->validate([
                    'startTime' => 'nullable|date',
                    'endTime' => 'nullable|date|after_or_equal:startTime',
                    'quizAttempts' => 'nullable|integer|min:1',
                    'quizTimer' => 'nullable|integer|min:1',
                    'quizTimerEnabled' => 'nullable|boolean',
                    'shuffleQuestions' => 'nullable|boolean',
                    'shuffleChoices' => 'nullable|boolean',
                    'showCorrectAnswers' => 'nullable|boolean',
                    'showCorrectQuestion' => 'nullable|boolean',
                    'autoSubmitOnTimeout' => 'nullable|boolean',
                    'allowLateSubmission' => 'nullable|boolean',
                    'showScoreAfterQuiz' => 'nullable|boolean',
                ]);
            } catch (ValidationException $e) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $e->errors(),
                ], 422);
            }

            // Additional validation: if quizTimerEnabled is true, quizTimer must be provided
            if (isset($validated['quizTimerEnabled']) && $validated['quizTimerEnabled'] === true) {
                if (empty($validated['quizTimer'])) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Quiz timer duration is required when timer is enabled.',
                    ], 422);
                }
            }

            // Business rule: showCorrectAnswers requires showCorrectQuestion to be true
            if (isset($validated['showCorrectAnswers']) && $validated['showCorrectAnswers'] === true) {
                $showCorrectQuestion = $validated['showCorrectQuestion'] ?? false;
                if (!$showCorrectQuestion) {
                    return response()->json([
                        'success' => false,
                        'message' => 'showCorrectQuestion must be enabled to show correct answers.',
                        'errors' => [
                            'showCorrectAnswers' => ['You must enable "Show Correct Question" before enabling "Show Correct Answers".']
                        ],
                    ], 422);
                }
            }

            // Create or update settings
            $setting = PersonalQuizSetting::updateOrCreate(
                ['personalQuizID' => $personalQuizID],
                $validated
            );

            $setting->load('personalQuiz');

            return response()->json([
                'success' => true,
                'message' => 'Quiz settings saved successfully.',
                'setting' => $setting,
            ], 200);
        } catch (\Throwable $e) {
            Log::error('Error saving quiz settings', [
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
                'message' => 'An internal error occurred while saving quiz settings.',
                'error' => app()->environment('local') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Update configuration for a personal quiz.
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

            // Verify the quiz belongs to the user
            $quiz = PersonalQuiz::where('personalQuizID', $personalQuizID)
                ->where('created_by', $user->userID)
                ->first();

            if (!$quiz) {
                return response()->json([
                    'success' => false,
                    'message' => 'Personal quiz not found or you do not have permission.',
                ], 404);
            }

            // Get existing settings or create if doesn't exist
            $setting = PersonalQuizSetting::firstOrCreate(
                ['personalQuizID' => $personalQuizID],
                [
                    'quizTimerEnabled' => false,
                    'shuffleQuestions' => false,
                    'shuffleChoices' => false,
                    'showCorrectAnswers' => false,
                    'showCorrectQuestion' => false,
                    'autoSubmitOnTimeout' => false,
                    'allowLateSubmission' => false,
                    'showScoreAfterQuiz' => false,
                ]
            );

            try {
                $validated = $request->validate([
                    'startTime' => 'nullable|date',
                    'endTime' => 'nullable|date|after_or_equal:startTime',
                    'quizAttempts' => 'nullable|integer|min:1',
                    'quizTimer' => 'nullable|integer|min:1',
                    'quizTimerEnabled' => 'nullable|boolean',
                    'shuffleQuestions' => 'nullable|boolean',
                    'shuffleChoices' => 'nullable|boolean',
                    'showCorrectAnswers' => 'nullable|boolean',
                    'showCorrectQuestion' => 'nullable|boolean',
                    'autoSubmitOnTimeout' => 'nullable|boolean',
                    'allowLateSubmission' => 'nullable|boolean',
                    'showScoreAfterQuiz' => 'nullable|boolean',
                ]);
            } catch (ValidationException $e) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $e->errors(),
                ], 422);
            }

            // Additional validation: if quizTimerEnabled is true, quizTimer must be provided
            $quizTimerEnabled = $validated['quizTimerEnabled'] ?? $setting->quizTimerEnabled;
            if ($quizTimerEnabled === true) {
                $quizTimer = $validated['quizTimer'] ?? $setting->quizTimer;
                if (empty($quizTimer)) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Quiz timer duration is required when timer is enabled.',
                    ], 422);
                }
            }

            // Business rule: showCorrectAnswers requires showCorrectQuestion to be true
            $showCorrectAnswers = $validated['showCorrectAnswers'] ?? $setting->showCorrectAnswers;
            $showCorrectQuestion = $validated['showCorrectQuestion'] ?? $setting->showCorrectQuestion;
            
            // If trying to enable showCorrectAnswers, check if showCorrectQuestion is enabled
            if ($showCorrectAnswers === true && !$showCorrectQuestion) {
                return response()->json([
                    'success' => false,
                    'message' => 'showCorrectQuestion must be enabled to show correct answers.',
                    'errors' => [
                        'showCorrectAnswers' => ['You must enable "Show Correct Question" before enabling "Show Correct Answers".']
                    ],
                ], 422);
            }
            
            // If disabling showCorrectQuestion, also disable showCorrectAnswers
            if (isset($validated['showCorrectQuestion']) && $validated['showCorrectQuestion'] === false) {
                $validated['showCorrectAnswers'] = false;
            }

            // Validate endTime against startTime (either new or existing)
            if (isset($validated['endTime'])) {
                $startTime = $validated['startTime'] ?? $setting->startTime;
                if ($startTime && $validated['endTime'] < $startTime) {
                    return response()->json([
                        'success' => false,
                        'message' => 'End time must be after or equal to start time.',
                    ], 422);
                }
            }

            $setting->update($validated);
            $setting->load('personalQuiz');

            return response()->json([
                'success' => true,
                'message' => 'Quiz settings updated successfully.',
                'setting' => $setting,
            ], 200);
        } catch (\Throwable $e) {
            Log::error('Error updating quiz settings', [
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
                'message' => 'An internal error occurred while updating quiz settings.',
                'error' => app()->environment('local') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Delete configuration for a personal quiz.
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

            // Verify the quiz belongs to the user
            $quiz = PersonalQuiz::where('personalQuizID', $personalQuizID)
                ->where('created_by', $user->userID)
                ->first();

            if (!$quiz) {
                return response()->json([
                    'success' => false,
                    'message' => 'Personal quiz not found or you do not have permission.',
                ], 404);
            }

            $setting = PersonalQuizSetting::where('personalQuizID', $personalQuizID)->first();

            if (!$setting) {
                return response()->json([
                    'success' => false,
                    'message' => 'Quiz settings not found.',
                ], 404);
            }

            $setting->delete();

            return response()->json([
                'success' => true,
                'message' => 'Quiz settings deleted successfully.',
            ], 200);
        } catch (\Throwable $e) {
            Log::error('Error deleting quiz settings', [
                'user_id' => optional(Auth::user())->userID,
                'personal_quiz_id' => $personalQuizID,
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An internal error occurred while deleting quiz settings.',
                'error' => app()->environment('local') ? $e->getMessage() : null,
            ], 500);
        }
    }
}
