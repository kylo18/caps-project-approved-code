<?php

namespace Modules\PersonalExams\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Modules\PersonalExams\Models\PersonalQuiz;
use Modules\PersonalExams\Models\PersonalQuizSetting;

class PersonalQuizSettingController extends Controller
{
    /**
     * Empty strings from JSON forms break nullable|date; normalize before validation.
     */
    private function mergeEmptyDateFields(Request $request): void
    {
        foreach (['startTime', 'endTime'] as $field) {
            if ($request->has($field) && $request->input($field) === '') {
                $request->merge([$field => null]);
            }
        }
    }

    /**
     * API payload: include personalQuiz for frontends that expect setting.personalQuiz.
     * (Settings are keyed by class assignment; quiz metadata comes via class_personal_quizzes.)
     */
    private function settingResponse(PersonalQuizSetting $setting): array
    {
        $setting->loadMissing(['classPersonalQuiz.personalQuiz']);

        $data = $setting->toArray();
        $data['personalQuiz'] = $setting->classPersonalQuiz?->personalQuiz;

        return $data;
    }

    /**
     * Get configuration for a specific quiz assignment inside a class.
     * Settings are now stored per class quiz (classPersonalQuizID).
     */
    public function show($classPersonalQuizID)
    {
        try {
            $user = Auth::user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized',
                ], 401);
            }

            // Verify the class quiz assignment belongs to one of the user's classes
            $classQuiz = \Modules\PersonalClasses\Models\ClassPersonalQuiz::with('class', 'personalQuiz')
                ->where('classPersonalQuizID', $classPersonalQuizID)
                ->first();

            if (!$classQuiz || $classQuiz->class->facultyID !== $user->userID) {
                return response()->json([
                    'success' => false,
                    'message' => 'Quiz assignment not found or you do not have permission.',
                ], 404);
            }

            // Get or create settings
            $setting = PersonalQuizSetting::firstOrCreate(
                ['classPersonalQuizID' => $classPersonalQuizID],
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

            // Explicitly include start/end times for the quiz in this class
            $classAssignment = [
                'startDate' => $classQuiz->startDate?->format('Y-m-d H:i:s'),
                'deadlineDate' => $classQuiz->deadlineDate?->format('Y-m-d H:i:s'),
            ];
            $settingPayload = $setting->toArray();
            $settingPayload['startTime'] = $setting->startTime?->format('Y-m-d H:i:s');
            $settingPayload['endTime'] = $setting->endTime?->format('Y-m-d H:i:s');

            return response()->json([
                'success' => true,
                'message' => 'Quiz settings retrieved successfully.',
                'setting' => $settingPayload,
                'classAssignment' => $classAssignment,
            ], 200);
        } catch (\Throwable $e) {
            Log::error('Error retrieving quiz settings', [
                'user_id' => optional(Auth::user())->userID,
                'class_personal_quiz_id' => $classPersonalQuizID,
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An error occurred while retrieving quiz settings.',
            ], 500);
        }
    }

    /**
     * Create or update configuration for a quiz assignment inside a class.
     */
    public function store(Request $request, $classPersonalQuizID)
    {
        try {
            $user = Auth::user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized',
                ], 401);
            }

            // Verify the class quiz assignment belongs to one of the user's classes
            $classQuiz = \Modules\PersonalClasses\Models\ClassPersonalQuiz::with('class', 'personalQuiz')
                ->where('classPersonalQuizID', $classPersonalQuizID)
                ->first();

            if (!$classQuiz || $classQuiz->class->facultyID !== $user->userID) {
                return response()->json([
                    'success' => false,
                    'message' => 'Quiz assignment not found or you do not have permission.',
                ], 404);
            }

            $this->mergeEmptyDateFields($request);

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

            // Create or update settings (per class quiz)
            $setting = PersonalQuizSetting::updateOrCreate(
                ['classPersonalQuizID' => $classPersonalQuizID],
                $validated
            );

            return response()->json([
                'success' => true,
                'message' => 'Quiz settings saved successfully.',
                'setting' => $this->settingResponse($setting),
            ], 200);
        } catch (\Throwable $e) {
            Log::error('Error saving quiz settings', [
                'user_id' => optional(Auth::user())->userID,
                'class_personal_quiz_id' => $classPersonalQuizID,
                'payload' => $request->all(),
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An internal error occurred while saving quiz settings.',
            ], 500);
        }
    }

    /**
     * Update configuration for a quiz assignment inside a class.
     */
    public function update(Request $request, $classPersonalQuizID)
    {
        try {
            $user = Auth::user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized',
                ], 401);
            }

            // Verify the class quiz assignment belongs to one of the user's classes
            $classQuiz = \Modules\PersonalClasses\Models\ClassPersonalQuiz::with('class', 'personalQuiz')
                ->where('classPersonalQuizID', $classPersonalQuizID)
                ->first();

            if (!$classQuiz || $classQuiz->class->facultyID !== $user->userID) {
                return response()->json([
                    'success' => false,
                    'message' => 'Quiz assignment not found or you do not have permission.',
                ], 404);
            }

            $this->mergeEmptyDateFields($request);

            // Get existing settings or create if doesn't exist (per class quiz)
            $setting = PersonalQuizSetting::firstOrCreate(
                ['classPersonalQuizID' => $classPersonalQuizID],
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
                $startTime = isset($validated['startTime'])
                    ? Carbon::parse($validated['startTime'])
                    : $setting->startTime;
                if ($startTime && Carbon::parse($validated['endTime'])->lt($startTime)) {
                    return response()->json([
                        'success' => false,
                        'message' => 'End time must be after or equal to start time.',
                    ], 422);
                }
            }

            $setting->update($validated);

            return response()->json([
                'success' => true,
                'message' => 'Quiz settings updated successfully.',
                'setting' => $this->settingResponse($setting->fresh()),
            ], 200);
        } catch (\Throwable $e) {
            Log::error('Error updating quiz settings', [
                'user_id' => optional(Auth::user())->userID,
                'class_personal_quiz_id' => $classPersonalQuizID,
                'payload' => $request->all(),
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An internal error occurred while updating quiz settings.',
            ], 500);
        }
    }

    /**
     * Delete configuration for a quiz assignment inside a class.
     */
    public function destroy($classPersonalQuizID)
    {
        try {
            $user = Auth::user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized',
                ], 401);
            }

            // Verify the class quiz assignment belongs to one of the user's classes
            $classQuiz = \Modules\PersonalClasses\Models\ClassPersonalQuiz::with('class', 'personalQuiz')
                ->where('classPersonalQuizID', $classPersonalQuizID)
                ->first();

            if (!$classQuiz || $classQuiz->class->facultyID !== $user->userID) {
                return response()->json([
                    'success' => false,
                    'message' => 'Quiz assignment not found or you do not have permission.',
                ], 404);
            }

            $setting = PersonalQuizSetting::where('classPersonalQuizID', $classPersonalQuizID)->first();

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
                'class_personal_quiz_id' => $classPersonalQuizID,
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An internal error occurred while deleting quiz settings.',
            ], 500);
        }
    }
}
