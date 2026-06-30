<?php

namespace Modules\PersonalExams\Controllers;

use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;
use Modules\PersonalClasses\Models\ClassPersonalQuiz;
use Modules\PersonalClasses\Models\ClassEnrollment;
use Modules\PersonalExams\Models\PersonalQuiz;
use Modules\PersonalExams\Models\PersonalQuizQuestion;
use Modules\PersonalExams\Models\PersonalQuizChoice;
use Modules\PersonalExams\Models\StudentQuizResult;
use Modules\PersonalExams\Models\StudentQuizAttempt;
use Modules\PersonalExams\Models\StudentQuizAttemptAnswer;

class StudentQuizController extends Controller
{
    /**
     * Align POST body with validation: accept camelCase from clients that mirror /start JSON,
     * coerce numeric strings, and normalize started_at (ISO string or unix ms/seconds).
     */
    private function normalizeQuizSubmitRequest(Request $request): void
    {
        $data = $request->all();

        $attemptNo = $data['attempt_number'] ?? $data['attemptNumber'] ?? null;
        if ($attemptNo !== null && $attemptNo !== '') {
            $request->merge(['attempt_number' => (int) $attemptNo]);
        }

        $rawStarted = $data['started_at'] ?? $data['startedAt'] ?? null;
        if ($rawStarted === '' || $rawStarted === null) {
            $request->merge(['started_at' => null]);
        } elseif (is_numeric($rawStarted)) {
            $n = (int) $rawStarted;
            if ($n > 1_000_000_000_000) {
                $request->merge(['started_at' => Carbon::createFromTimestampMs($n)->toIso8601String()]);
            } elseif ($n > 1_000_000_000) {
                $request->merge(['started_at' => Carbon::createFromTimestamp($n)->toIso8601String()]);
            }
        } elseif (is_string($rawStarted)) {
            $request->merge(['started_at' => $rawStarted]);
        }

        $tts = $data['time_taken_seconds'] ?? $data['timeTakenSeconds'] ?? null;
        if ($tts !== null && $tts !== '') {
            $request->merge(['time_taken_seconds' => max(0, (int) $tts)]);
        }

        if (isset($data['answers']) && is_array($data['answers'])) {
            $normalized = [];
            foreach ($data['answers'] as $row) {
                if (! is_array($row)) {
                    continue;
                }
                $qid = $row['personalQuizQuestionID'] ?? $row['personalQuizQuestionId'] ?? null;
                if ($qid === null || $qid === '') {
                    continue;
                }
                $sid = $row['selectedChoiceID'] ?? $row['selectedChoiceId'] ?? null;
                if ($sid === '' || $sid === false) {
                    $sid = null;
                } elseif (is_numeric($sid)) {
                    $sid = (int) $sid;
                } else {
                    $sid = null;
                }
                $normalized[] = [
                    'personalQuizQuestionID' => (int) $qid,
                    'selectedChoiceID' => $sid,
                ];
            }
            $request->merge(['answers' => $normalized]);
        }
    }

    /**
     * Get quiz information before starting.
     * Displays quiz details, settings, and availability for student review.
     */
    public function getQuizInfo($classPersonalQuizID)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return response()->json(['success' => false, 'message' => 'Unauthorized'], 401);
            }

            if ($user->roleID != 1) {
                return response()->json(['success' => false, 'message' => 'Only students can view quiz information.'], 403);
            }

            // Get class quiz assignment with per-class settings
            $classQuizAssignment = ClassPersonalQuiz::with([
                'setting',
                'personalQuiz.subject',
                'personalQuiz.quizType',
                'class'
            ])->find($classPersonalQuizID);

            if (!$classQuizAssignment) {
                return response()->json(['success' => false, 'message' => 'Quiz assignment not found.'], 404);
            }

            // Verify student is enrolled
            $enrollment = ClassEnrollment::where('classID', $classQuizAssignment->classID)
                ->where('studentID', $user->userID)
                ->first();

            if (!$enrollment) {
                return response()->json(['success' => false, 'message' => 'You are not enrolled in this class.'], 403);
            }

            $quiz = $classQuizAssignment->personalQuiz;
            $settings = $classQuizAssignment->setting;

            // Get quiz statistics
            $totalItems = PersonalQuizQuestion::where('personalQuizID', $quiz->personalQuizID)->count();
            $totalPoints = PersonalQuizQuestion::where('personalQuizID', $quiz->personalQuizID)->sum('personalQuizScore');

            // Get student's previous attempts
            $previousAttempts = StudentQuizResult::where('class_quiz_assignment_id', $classPersonalQuizID)
                ->where('studentID', $user->userID)
                ->orderByDesc('attempt_number')
                ->get();

            $attemptCount = $previousAttempts->count();
            $nextAttemptNumber = $attemptCount + 1;

            // Check availability (class assignment dates take priority over setting dates)
            $now = now();
            $isAvailable = true;
            $availabilityMessage = null;
            $availabilityDetails = [];
            $effectiveStartDate = $classQuizAssignment->startDate ?: ($settings ? $settings->startTime : null);
            $effectiveEndDate = $classQuizAssignment->deadlineDate ?: ($settings ? $settings->endTime : null);

            // Check effective start date
            if ($effectiveStartDate && $now < $effectiveStartDate) {
                $isAvailable = false;
                $availabilityMessage = 'Quiz is not yet available.';
                $availabilityDetails[] = [
                    'type' => 'start_date',
                    'message' => 'Available from: ' . $effectiveStartDate->format('M d, Y H:i'),
                    'date' => $effectiveStartDate,
                ];
            }

            if ($effectiveEndDate) {
                $availabilityDetails[] = [
                    'type' => 'deadline_date',
                    'message' => 'Deadline: ' . $effectiveEndDate->format('M d, Y H:i'),
                    'date' => $effectiveEndDate,
                ];

                if ($now > $effectiveEndDate) {
                    if (!$settings || !$settings->allowLateSubmission) {
                        $isAvailable = false;
                        $availabilityMessage = 'Quiz deadline has passed.';
                    } else {
                        $availabilityDetails[] = [
                            'type' => 'late_submission',
                            'message' => 'Late submission is allowed.',
                        ];
                    }
                }
            }

            // Check quiz-level settings
            if ($settings) {
                if (!$classQuizAssignment->startDate && $settings->startTime && $now < $settings->startTime) {
                    $isAvailable = false;
                    $availabilityMessage = 'Quiz is not yet available.';
                    $availabilityDetails[] = [
                        'type' => 'quiz_start_time',
                        'message' => 'Quiz starts at: ' . $settings->startTime->format('M d, Y H:i'),
                        'date' => $settings->startTime,
                    ];
                }

                if (!$classQuizAssignment->deadlineDate && $settings->endTime) {
                    $availabilityDetails[] = [
                        'type' => 'quiz_end_time',
                        'message' => 'Quiz ends at: ' . $settings->endTime->format('M d, Y H:i'),
                        'date' => $settings->endTime,
                    ];

                    if ($now > $settings->endTime) {
                        if (!$settings->allowLateSubmission) {
                            $isAvailable = false;
                            $availabilityMessage = 'Quiz deadline has passed.';
                        } else {
                            $availabilityDetails[] = [
                                'type' => 'late_submission',
                                'message' => 'Late submission is allowed.',
                            ];
                        }
                    }
                }

                // Check attempt limit
                if ($settings->quizAttempts) {
                    $availabilityDetails[] = [
                        'type' => 'attempt_limit',
                        'message' => 'Maximum attempts: ' . $settings->quizAttempts,
                        'value' => $settings->quizAttempts,
                    ];

                    if ($attemptCount >= $settings->quizAttempts) {
                        $isAvailable = false;
                        $availabilityMessage = 'You have reached the maximum number of attempts for this quiz.';
                    } else {
                        $availabilityDetails[] = [
                            'type' => 'remaining_attempts',
                            'message' => 'Remaining attempts: ' . ($settings->quizAttempts - $attemptCount),
                            'value' => $settings->quizAttempts - $attemptCount,
                        ];
                    }
                } else {
                    $availabilityDetails[] = [
                        'type' => 'attempt_limit',
                        'message' => 'Unlimited attempts allowed',
                    ];
                }
            }

            // Prepare quiz information
            $quizInfo = [
                'classPersonalQuizID' => $classPersonalQuizID,
                'quiz' => [
                    'personalQuizID' => $quiz->personalQuizID,
                    'title' => $quiz->title,
                    'description' => $quiz->description,
                    'instruction' => $quiz->instruction,
                    'subject' => $quiz->subject ? [
                        'subjectID' => $quiz->subject->subjectID,
                        'subjectCode' => $quiz->subject->subjectCode,
                        'subjectName' => $quiz->subject->subjectName,
                    ] : null,
                    'quizType' => $quiz->quizType ? [
                        'id' => $quiz->quizType->id,
                        'name' => $quiz->quizType->name,
                    ] : null,
                ],
                'statistics' => [
                    'totalItems' => $totalItems,
                    'totalPoints' => $totalPoints,
                ],
                'settings' => $settings ? [
                    'quizTimer' => $settings->quizTimer,
                    'quizTimerEnabled' => $settings->quizTimerEnabled,
                    'timeDuration' => $settings->quizTimerEnabled && $settings->quizTimer ? [
                        'minutes' => $settings->quizTimer,
                        'seconds' => $settings->quizTimer * 60,
                        'formatted' => $settings->quizTimer . ' minute' . ($settings->quizTimer != 1 ? 's' : ''),
                    ] : null,
                    'shuffleQuestions' => $settings->shuffleQuestions,
                    'shuffleChoices' => $settings->shuffleChoices,
                    'showCorrectAnswers' => $settings->showCorrectAnswers,
                    'showCorrectQuestion' => $settings->showCorrectQuestion,
                    'showScoreAfterQuiz' => $settings->showScoreAfterQuiz,
                    'autoSubmitOnTimeout' => $settings->autoSubmitOnTimeout,
                    'allowLateSubmission' => $settings->allowLateSubmission,
                ] : null,
                'classAssignment' => [
                    'startDate' => $classQuizAssignment->startDate,
                    'deadlineDate' => $classQuizAssignment->deadlineDate,
                    'className' => $classQuizAssignment->class ? $classQuizAssignment->class->className : null,
                ],
                'attempts' => [
                    'previousAttempts' => $previousAttempts->map(function ($attempt) {
                        return [
                            'attempt_number' => $attempt->attempt_number,
                            'score' => $attempt->score,
                            'total_score' => $attempt->total_score,
                            'percentage' => $attempt->percentage,
                            'isPassed' => $attempt->isPassed,
                            'submitted_at' => $attempt->submitted_at,
                        ];
                    }),
                    'attemptCount' => $attemptCount,
                    'nextAttemptNumber' => $nextAttemptNumber,
                ],
                'availability' => [
                    'isAvailable' => $isAvailable,
                    'message' => $availabilityMessage,
                    'details' => $availabilityDetails,
                ],
                'warnings' => $this->getQuizWarnings($settings, $classQuizAssignment, $attemptCount),
            ];

            return response()->json([
                'success' => true,
                'message' => 'Quiz information retrieved successfully.',
                'quizInfo' => $quizInfo,
            ], 200);
        } catch (\Throwable $e) {
            Log::error('Error retrieving quiz information', [
                'user_id' => optional(Auth::user())->userID,
                'class_quiz_assignment_id' => $classPersonalQuizID,
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An error occurred while retrieving quiz information.',
            ], 500);
        }
    }

    /**
     * Get warnings and important information for the student.
     */
    private function getQuizWarnings($settings, $classQuizAssignment, $attemptCount)
    {
        $warnings = [];
        $now = now();

        // Timer warning
        if ($settings && $settings->quizTimerEnabled && $settings->quizTimer) {
            $warnings[] = [
                'type' => 'timer',
                'message' => 'This quiz has a time limit of ' . $settings->quizTimer . ' minute' . ($settings->quizTimer != 1 ? 's' : '') . '.',
                'important' => true,
            ];

            if ($settings->autoSubmitOnTimeout) {
                $warnings[] = [
                    'type' => 'auto_submit',
                    'message' => 'The quiz will automatically submit when time runs out.',
                    'important' => true,
                ];
            }
        }

        // Deadline warning
        if ($classQuizAssignment->deadlineDate) {
            $timeUntilDeadline = $now->diffInMinutes($classQuizAssignment->deadlineDate, false);
            if ($timeUntilDeadline > 0 && $timeUntilDeadline < 60) {
                $warnings[] = [
                    'type' => 'deadline_soon',
                    'message' => 'Less than 1 hour remaining until deadline.',
                    'important' => true,
                ];
            }
        }

        // Attempt limit warning
        if ($settings && $settings->quizAttempts) {
            $remainingAttempts = $settings->quizAttempts - $attemptCount;
            if ($remainingAttempts <= 1 && $remainingAttempts > 0) {
                $warnings[] = [
                    'type' => 'last_attempt',
                    'message' => 'This is your last attempt. Make sure you are ready before starting.',
                    'important' => true,
                ];
            }
        }

        // Shuffling warning
        if ($settings) {
            if ($settings->shuffleQuestions) {
                $warnings[] = [
                    'type' => 'shuffle_questions',
                    'message' => 'Questions will be shuffled. Each attempt may show questions in a different order.',
                    'important' => false,
                ];
            }

            if ($settings->shuffleChoices) {
                $warnings[] = [
                    'type' => 'shuffle_choices',
                    'message' => 'Answer choices will be shuffled. Each attempt may show choices in a different order.',
                    'important' => false,
                ];
            }
        }

        // Late submission warning
        if ($classQuizAssignment->deadlineDate && $now > $classQuizAssignment->deadlineDate) {
            if ($settings && $settings->allowLateSubmission) {
                $warnings[] = [
                    'type' => 'late_submission',
                    'message' => 'You are submitting after the deadline. Late submission is allowed.',
                    'important' => true,
                ];
            }
        }

        return $warnings;
    }

    /**
     * Start a quiz - Get quiz questions for a student to take.
     * Validates availability, attempts, and returns questions with choices.
     */
    public function startQuiz(Request $request, $classPersonalQuizID)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return response()->json(['success' => false, 'message' => 'Unauthorized'], 401);
            }

            if ($user->roleID != 1) {
                return response()->json(['success' => false, 'message' => 'Only students can take quizzes.'], 403);
            }

            // Get class quiz assignment with per-class settings
            $classQuizAssignment = ClassPersonalQuiz::with(['setting', 'class', 'personalQuiz'])
                ->find($classPersonalQuizID);

            if (!$classQuizAssignment) {
                return response()->json(['success' => false, 'message' => 'Quiz assignment not found.'], 404);
            }

            // Verify student is enrolled
            $enrollment = ClassEnrollment::where('classID', $classQuizAssignment->classID)
                ->where('studentID', $user->userID)
                ->first();

            if (!$enrollment) {
                return response()->json(['success' => false, 'message' => 'You are not enrolled in this class.'], 403);
            }

            $quiz = $classQuizAssignment->personalQuiz;
            $settings = $classQuizAssignment->setting;

            // Check availability (class assignment dates take priority over setting dates)
            $now = now();
            $effectiveStartDate = $classQuizAssignment->startDate ?: ($settings ? $settings->startTime : null);
            $effectiveEndDate = $classQuizAssignment->deadlineDate ?: ($settings ? $settings->endTime : null);

            // Check effective start date
            if ($effectiveStartDate && $now < $effectiveStartDate) {
                return response()->json([
                    'success' => false,
                    'message' => 'Quiz is not yet available. It will be available on ' . $effectiveStartDate->format('M d, Y H:i'),
                ], 403);
            }

            if ($effectiveEndDate && $now > $effectiveEndDate) {
                if (!$settings || !$settings->allowLateSubmission) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Quiz deadline has passed.',
                    ], 403);
                }
            }

            // Check quiz-level settings
            if ($settings) {
                if (!$classQuizAssignment->startDate && $settings->startTime && $now < $settings->startTime) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Quiz is not yet available. It will be available on ' . $settings->startTime->format('M d, Y H:i'),
                    ], 403);
                }

                if (!$classQuizAssignment->deadlineDate && $settings->endTime && $now > $settings->endTime) {
                    if (!$settings->allowLateSubmission) {
                        return response()->json([
                            'success' => false,
                            'message' => 'Quiz deadline has passed.',
                        ], 403);
                    }
                }

                // Check attempt limit
                if ($settings->quizAttempts) {
                    $existingResults = StudentQuizResult::where('class_quiz_assignment_id', $classPersonalQuizID)
                        ->where('studentID', $user->userID)
                        ->get();

                    if ($existingResults->count() >= $settings->quizAttempts) {
                        return response()->json([
                            'success' => false,
                            'message' => 'You have reached the maximum number of attempts for this quiz.',
                        ], 403);
                    }
                }
            }

            // Get next attempt number
            $nextAttemptNumber = 1;
            if ($settings && $settings->quizAttempts) {
                $lastResult = StudentQuizResult::where('class_quiz_assignment_id', $classPersonalQuizID)
                    ->where('studentID', $user->userID)
                    ->orderByDesc('attempt_number')
                    ->first();

                if ($lastResult) {
                    $nextAttemptNumber = $lastResult->attempt_number + 1;
                }
            }

            // Get questions
            $questions = PersonalQuizQuestion::where('personalQuizID', $quiz->personalQuizID)
                ->with(['personalQuizChoices' => function($query) {
                    $query->orderBy('position', 'asc');
                }])
                ->get();

            if ($questions->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'This quiz has no questions.',
                ], 404);
            }

            // Shuffle questions if enabled
            if ($settings && $settings->shuffleQuestions) {
                $questions = $questions->shuffle();
            }

            // Format questions and choices
            $formattedQuestions = $questions->map(function ($question) use ($settings) {
                $choices = $question->personalQuizChoices;

                // Shuffle choices if enabled (but keep position 5 "None of the above" at the end)
                if ($settings && $settings->shuffleChoices) {
                    $regularChoices = $choices->where('position', '!=', 5)->shuffle();
                    $noneChoice = $choices->where('position', 5)->first();
                    $choices = $regularChoices->push($noneChoice)->filter();
                }

                // Decrypt question text
                $questionText = null;
                try {
                    if ($question->personalQuizQuestionText) {
                        $questionText = Crypt::decryptString($question->personalQuizQuestionText);
                    }
                } catch (\Exception $e) {
                    $questionText = '[Decryption Error]';
                    Log::warning('Failed to decrypt question text', [
                        'question_id' => $question->personalQuizQuestionID,
                        'error' => $e->getMessage(),
                    ]);
                }

                // Format choices (decrypt text, but don't show correct answer yet)
                $formattedChoices = $choices->map(function ($choice) {
                    $choiceText = null;
                    try {
                        if ($choice->choiceText) {
                            $choiceText = Crypt::decryptString($choice->choiceText);
                        }
                    } catch (\Exception $e) {
                        $choiceText = '[Decryption Error]';
                        Log::warning('Failed to decrypt choice text', [
                            'choice_id' => $choice->personalQuizChoiceID,
                            'error' => $e->getMessage(),
                        ]);
                    }

                    // Generate image URL
                    $imageUrl = null;
                    if ($choice->image) {
                        if (filter_var($choice->image, FILTER_VALIDATE_URL)) {
                            $imageUrl = $choice->image;
                        } else {
                            $imageUrl = asset('storage/' . $choice->image);
                        }
                    }

                    return [
                        'personalQuizChoiceID' => $choice->personalQuizChoiceID,
                        'choiceText' => $choiceText,
                        'image' => $imageUrl,
                        'position' => $choice->position,
                        // Don't include isCorrect - students shouldn't see this during quiz
                    ];
                });

                // Generate question image URL
                $questionImageUrl = null;
                if ($question->personalQuizImage) {
                    if (filter_var($question->personalQuizImage, FILTER_VALIDATE_URL)) {
                        $questionImageUrl = $question->personalQuizImage;
                    } else {
                        $questionImageUrl = asset('storage/' . $question->personalQuizImage);
                    }
                }

                return [
                    'personalQuizQuestionID' => $question->personalQuizQuestionID,
                    'questionText' => $questionText,
                    'image' => $questionImageUrl,
                    'score' => $question->personalQuizScore,
                    'choices' => $formattedChoices,
                ];
            });

            // Create or update student quiz attempt record
            $attempt = StudentQuizAttempt::updateOrCreate(
                [
                    'personalQuizID' => $quiz->personalQuizID,
                    'studentID' => $user->userID,
                    'attemptNumber' => $nextAttemptNumber,
                ],
                [
                    'startedAt' => now(),
                ]
            );

            return response()->json([
                'success' => true,
                'message' => 'Quiz started successfully.',
                'quiz' => [
                    'personalQuizID' => $quiz->personalQuizID,
                    'title' => $quiz->title,
                    'description' => $quiz->description,
                    'instruction' => $quiz->instruction,
                ],
                'settings' => $settings ? [
                    'quizTimer' => $settings->quizTimer,
                    'quizTimerEnabled' => $settings->quizTimerEnabled,
                    'showCorrectAnswers' => $settings->showCorrectAnswers,
                    'showCorrectQuestion' => $settings->showCorrectQuestion,
                    'showScoreAfterQuiz' => $settings->showScoreAfterQuiz,
                ] : null,
                'questions' => $formattedQuestions,
                'attemptNumber' => $nextAttemptNumber,
                'startedAt' => $attempt->startedAt,
                // Aliases for submit payload (same values as attemptNumber / startedAt)
                'attempt_number' => $nextAttemptNumber,
                'started_at' => $attempt->startedAt,
            ], 200);
        } catch (\Throwable $e) {
            Log::error('Error starting quiz', [
                'user_id' => optional(Auth::user())->userID,
                'class_quiz_assignment_id' => $classPersonalQuizID,
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An error occurred while starting the quiz.',
            ], 500);
        }
    }

    /**
     * Submit quiz answers and calculate score.
     */
    public function submitQuiz(Request $request, $classPersonalQuizID)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return response()->json(['success' => false, 'message' => 'Unauthorized'], 401);
            }

            if ($user->roleID != 1) {
                return response()->json(['success' => false, 'message' => 'Only students can submit quizzes.'], 403);
            }

            $this->normalizeQuizSubmitRequest($request);

            try {
                $validated = $request->validate([
                    'attempt_number' => 'required|integer|min:1',
                    'answers' => 'required|array|min:1',
                    'answers.*.personalQuizQuestionID' => 'required|integer|exists:personal_quiz_questions,personalQuizQuestionID',
                    'answers.*.selectedChoiceID' => 'nullable|integer|exists:personal_quiz_choices,personalQuizChoiceID',
                    'started_at' => 'nullable|date',
                    'time_taken_seconds' => 'nullable|integer|min:0',
                ]);
            } catch (ValidationException $e) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $e->errors(),
                ], 422);
            }

            // Get class quiz assignment with per-class settings
            $classQuizAssignment = ClassPersonalQuiz::with(['setting', 'personalQuiz', 'class'])
                ->find($classPersonalQuizID);

            if (!$classQuizAssignment) {
                return response()->json(['success' => false, 'message' => 'Quiz assignment not found.'], 404);
            }

            // Verify student is enrolled
            $enrollment = ClassEnrollment::where('classID', $classQuizAssignment->classID)
                ->where('studentID', $user->userID)
                ->first();

            if (!$enrollment) {
                return response()->json(['success' => false, 'message' => 'You are not enrolled in this class.'], 403);
            }

            $quiz = $classQuizAssignment->personalQuiz;
            if (! $quiz) {
                return response()->json([
                    'success' => false,
                    'message' => 'This class quiz is not linked to a valid personal quiz.',
                ], 422);
            }

            $settings = $classQuizAssignment->setting;

            // Check if result already exists for this attempt
            $existingResult = StudentQuizResult::where('class_quiz_assignment_id', $classPersonalQuizID)
                ->where('studentID', $user->userID)
                ->where('attempt_number', $validated['attempt_number'])
                ->first();

            if ($existingResult) {
                return response()->json([
                    'success' => false,
                    'message' => 'This attempt has already been submitted.',
                ], 422);
            }

            DB::beginTransaction();

            try {
                // Get all questions with correct answers
                $questions = PersonalQuizQuestion::where('personalQuizID', $quiz->personalQuizID)
                    ->with('personalQuizChoices')
                    ->get()
                    ->keyBy('personalQuizQuestionID');

                $totalScore = 0;
                $earnedScore = 0;
                $correctAnswers = [];
                $studentAnswers = [];

                // Calculate score
                foreach ($validated['answers'] as $answer) {
                    $questionID = $answer['personalQuizQuestionID'];
                    $selectedChoiceID = $answer['selectedChoiceID'] ?? null;

                    $question = $questions->get($questionID);
                    if (!$question) {
                        continue;
                    }

                    $totalScore += $question->personalQuizScore;

                    // Find the selected choice
                    $selectedChoice = null;
                    if ($selectedChoiceID) {
                        $selectedChoice = $question->personalQuizChoices->firstWhere('personalQuizChoiceID', $selectedChoiceID);
                    }

                    // Check if answer is correct
                    $isCorrect = false;
                    if ($selectedChoice && $selectedChoice->isCorrect) {
                        $isCorrect = true;
                        $earnedScore += $question->personalQuizScore;
                    }

                    // Get correct choice for this question
                    $correctChoice = $question->personalQuizChoices->firstWhere('isCorrect', true);

                    // Decrypt texts for response
                    $questionText = null;
                    $selectedChoiceText = null;
                    $correctChoiceText = null;

                    try {
                        if ($question->personalQuizQuestionText) {
                            $questionText = Crypt::decryptString($question->personalQuizQuestionText);
                        }
                        if ($selectedChoice && $selectedChoice->choiceText) {
                            $selectedChoiceText = Crypt::decryptString($selectedChoice->choiceText);
                        }
                        if ($correctChoice && $correctChoice->choiceText) {
                            $correctChoiceText = Crypt::decryptString($correctChoice->choiceText);
                        }
                    } catch (\Exception $e) {
                        Log::warning('Failed to decrypt text in quiz submission', [
                            'question_id' => $questionID,
                            'error' => $e->getMessage(),
                        ]);
                    }

                    $correctAnswers[] = [
                        'personalQuizQuestionID' => $questionID,
                        'questionText' => $questionText,
                        'isCorrect' => $isCorrect,
                        'selectedChoiceID' => $selectedChoiceID,
                        'selectedChoiceText' => $selectedChoiceText,
                        'correctChoiceID' => $correctChoice ? $correctChoice->personalQuizChoiceID : null,
                        'correctChoiceText' => $correctChoiceText,
                        'score' => $question->personalQuizScore,
                        'earnedScore' => $isCorrect ? $question->personalQuizScore : 0,
                    ];

                    $studentAnswers[] = [
                        'personalQuizQuestionID' => $questionID,
                        'selectedChoiceID' => $selectedChoiceID,
                    ];
                }

                // Calculate percentage
                $percentage = $totalScore > 0 ? ($earnedScore / $totalScore) * 100 : 0;

                // Determine if passed (assuming 60% is passing, adjust as needed)
                $isPassed = $percentage >= 60;

                // Prepare result data
                $resultData = [
                    'class_quiz_assignment_id' => $classPersonalQuizID,
                    'studentID' => $user->userID,
                    'score' => $earnedScore,
                    'total_score' => $totalScore,
                    'percentage' => round($percentage, 2),
                    'attempt_number' => $validated['attempt_number'],
                    'started_at' => $validated['started_at'] ?? now(),
                    'submitted_at' => now(),
                    'time_taken_seconds' => $validated['time_taken_seconds'] ?? null,
                    'isRecorded' => true,
                    'isPassed' => $isPassed,
                ];

                // Create result
                $result = StudentQuizResult::create($resultData);

                $this->persistQuizAttemptAnswers(
                    $correctAnswers,
                    $questions,
                    $result,
                    (int) $user->userID,
                    (int) $classPersonalQuizID,
                    $quiz
                );

                // Update student quiz attempt
                $attempt = StudentQuizAttempt::where('personalQuizID', $quiz->personalQuizID)
                    ->where('studentID', $user->userID)
                    ->where('attemptNumber', $validated['attempt_number'])
                    ->first();

                if ($attempt) {
                    $attempt->update(['completedAt' => now()]);
                }

                DB::commit();

                // Calculate time taken in minutes
                $timeTakenMinutes = null;
                if ($result->time_taken_seconds) { 
                    $timeTakenMinutes = round($result->time_taken_seconds / 60, 2);
                }

                // Determine if score should be shown to the student based on settings
                // Default behavior: if there are no settings configured, show the score.
                $showScoreAfterQuiz = $settings ? (bool) $settings->showScoreAfterQuiz : true;

                // Prepare detailed question results
                $questionResults = [];
                foreach ($validated['answers'] as $answer) {
                    $questionID = $answer['personalQuizQuestionID'];
                    $selectedChoiceID = $answer['selectedChoiceID'] ?? null;

                    $question = $questions->get($questionID);
                    if (!$question) {
                        continue;
                    }

                    // Find the selected choice
                    $selectedChoice = null;
                    if ($selectedChoiceID) {
                        $selectedChoice = $question->personalQuizChoices->firstWhere('personalQuizChoiceID', $selectedChoiceID);
                    }

                    // Check if answer is correct
                    $isCorrect = false;
                    if ($selectedChoice && $selectedChoice->isCorrect) {
                        $isCorrect = true;
                    }

                    // Get correct choice for this question
                    $correctChoice = $question->personalQuizChoices->firstWhere('isCorrect', true);

                    // Decrypt question text
                    $questionText = null;
                    try {
                        if ($question->personalQuizQuestionText) {
                            $questionText = Crypt::decryptString($question->personalQuizQuestionText);
                        }
                    } catch (\Exception $e) {
                        $questionText = '[Decryption Error]';
                        Log::warning('Failed to decrypt question text', [
                            'question_id' => $questionID,
                            'error' => $e->getMessage(),
                        ]);
                    }

                    // Generate question image URL
                    $questionImageUrl = null;
                    if ($question->personalQuizImage) {
                        if (filter_var($question->personalQuizImage, FILTER_VALIDATE_URL)) {
                            $questionImageUrl = $question->personalQuizImage;
                        } else {
                            $questionImageUrl = asset('storage/' . $question->personalQuizImage);
                        }
                    }

                    // Prepare selected choice data
                    $selectedChoiceData = null;
                    if ($selectedChoice) {
                        $selectedChoiceText = null;
                        try {
                            if ($selectedChoice->choiceText) {
                                $selectedChoiceText = Crypt::decryptString($selectedChoice->choiceText);
                            }
                        } catch (\Exception $e) {
                            $selectedChoiceText = '[Decryption Error]';
                        }

                        $selectedChoiceImageUrl = null;
                        if ($selectedChoice->image) {
                            if (filter_var($selectedChoice->image, FILTER_VALIDATE_URL)) {
                                $selectedChoiceImageUrl = $selectedChoice->image;
                            } else {
                                $selectedChoiceImageUrl = asset('storage/' . $selectedChoice->image);
                            }
                        }

                        $selectedChoiceData = [
                            'personalQuizChoiceID' => $selectedChoice->personalQuizChoiceID,
                            'choiceText' => $selectedChoiceText,
                            'image' => $selectedChoiceImageUrl,
                            'position' => $selectedChoice->position,
                        ];
                    }

                    // Prepare correct choice data (only if showCorrectAnswers is enabled)
                    // Note: showCorrectAnswers can only be true if showCorrectQuestion is also true (enforced in settings)
                    $correctChoiceData = null;
                    if ($settings && $settings->showCorrectAnswers && $settings->showCorrectQuestion && $correctChoice) {
                        $correctChoiceText = null;
                        try {
                            if ($correctChoice->choiceText) {
                                $correctChoiceText = Crypt::decryptString($correctChoice->choiceText);
                            }
                        } catch (\Exception $e) {
                            $correctChoiceText = '[Decryption Error]';
                        }

                        $correctChoiceImageUrl = null;
                        if ($correctChoice->image) {
                            if (filter_var($correctChoice->image, FILTER_VALIDATE_URL)) {
                                $correctChoiceImageUrl = $correctChoice->image;
                            } else {
                                $correctChoiceImageUrl = asset('storage/' . $correctChoice->image);
                            }
                        }

                        $correctChoiceData = [
                            'personalQuizChoiceID' => $correctChoice->personalQuizChoiceID,
                            'choiceText' => $correctChoiceText,
                            'image' => $correctChoiceImageUrl,
                            'position' => $correctChoice->position,
                        ];
                    }

                    $questionResult = [
                        'personalQuizQuestionID' => $questionID,
                        'questionText' => $questionText,
                        'questionImage' => $questionImageUrl,
                        'score' => $question->personalQuizScore,
                        'earnedScore' => $isCorrect ? $question->personalQuizScore : 0,
                    ];

                    // Include isCorrect if showCorrectQuestion is enabled
                    if ($settings && $settings->showCorrectQuestion) {
                        $questionResult['isCorrect'] = $isCorrect;
                    }

                    // Include selected choice
                    $questionResult['selectedChoice'] = $selectedChoiceData;

                    // Include correct choice if showCorrectAnswers is enabled
                    // Note: showCorrectAnswers can only be true if showCorrectQuestion is also true (enforced in settings)
                    if ($settings && $settings->showCorrectAnswers && $settings->showCorrectQuestion) {
                        $questionResult['correctChoice'] = $correctChoiceData;
                    }

                    $questionResults[] = $questionResult;
                }

                // Build result payload, respecting showScoreAfterQuiz setting
                $resultPayload = [
                    'id' => $result->id,
                    'attempt_number' => $result->attempt_number,
                    'time_taken_seconds' => $result->time_taken_seconds,
                    'time_taken_minutes' => $timeTakenMinutes,
                    'time_taken_formatted' => $timeTakenMinutes ? 
                        ($timeTakenMinutes >= 1 ? 
                            round($timeTakenMinutes) . ' minute' . (round($timeTakenMinutes) != 1 ? 's' : '') : 
                            $result->time_taken_seconds . ' second' . ($result->time_taken_seconds != 1 ? 's' : '')
                        ) : null,
                    'started_at' => $result->started_at,
                    'submitted_at' => $result->submitted_at,
                    'showScoreAfterQuiz' => $showScoreAfterQuiz,
                ];

                if ($showScoreAfterQuiz) {
                    // Include full score details
                    $resultPayload['score'] = $result->score;
                    $resultPayload['total_score'] = $result->total_score;
                    $resultPayload['percentage'] = $result->percentage;
                    $resultPayload['isPassed'] = $result->isPassed;
                } else {
                    // Hide score details from the student while still recording them in the database
                    $resultPayload['score'] = null;
                    $resultPayload['total_score'] = null;
                    $resultPayload['percentage'] = null;
                    $resultPayload['isPassed'] = null;
                }

                // Prepare response with all result data
                $response = [
                    'success' => true,
                    'message' => 'Quiz submitted successfully.',
                    'result' => $resultPayload,
                    'quiz' => [
                        'personalQuizID' => $quiz->personalQuizID,
                        'title' => $quiz->title,
                        'description' => $quiz->description,
                    ],
                    'questions' => $questionResults,
                    'settings' => $settings ? [
                        'showScoreAfterQuiz' => (bool) $settings->showScoreAfterQuiz,
                        'showCorrectQuestion' => (bool) $settings->showCorrectQuestion,
                        'showCorrectAnswers' => (bool) $settings->showCorrectAnswers,
                    ] : null,
                ];

                return response()->json($response, 200);
            } catch (QueryException $e) {
                DB::rollBack();

                Log::error('Quiz submit failed (database)', [
                    'user_id' => optional(Auth::user())->userID,
                    'class_quiz_assignment_id' => $classPersonalQuizID,
                    'sql_state' => $e->errorInfo[0] ?? null,
                    'driver_code' => $e->errorInfo[1] ?? null,
                    'message' => $e->getMessage(),
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'Could not save your quiz submission. Please try again or contact support if this continues.',
                    'error_code' => 'QUIZ_SUBMIT_DATABASE',
                ], 500);
            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }
        } catch (\Throwable $e) {
            Log::error('Error submitting quiz', [
                'user_id' => optional(Auth::user())->userID,
                'class_quiz_assignment_id' => $classPersonalQuizID,
                'payload' => $request->except(['password', 'password_confirmation']),
                'exception' => $e::class,
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An unexpected error occurred while submitting the quiz.',
                'error_code' => 'QUIZ_SUBMIT_FAILED',
            ], 500);
        }
    }

    /**
     * Store per-question rows for analytics. Skips silently if the migration has not been run yet.
     */
    private function persistQuizAttemptAnswers(
        array $correctAnswers,
        $questions,
        StudentQuizResult $result,
        int $studentId,
        int $classPersonalQuizId,
        PersonalQuiz $quiz
    ): void {
        if (! Schema::hasTable('student_quiz_attempt_answers')) {
            Log::warning('student_quiz_attempt_answers table missing; per-question analytics skipped. Run: php artisan migrate', [
                'student_quiz_result_id' => $result->id,
            ]);

            return;
        }

        foreach ($correctAnswers as $row) {
            $pq = $questions->get($row['personalQuizQuestionID']);
            if (! $pq) {
                continue;
            }

            $subjectId = $pq->personalQuizSubjectID ?? $quiz->subjectID;

            StudentQuizAttemptAnswer::create([
                'student_quiz_result_id' => $result->id,
                'studentID' => $studentId,
                'class_quiz_assignment_id' => $classPersonalQuizId,
                'personal_quiz_question_id' => $pq->personalQuizQuestionID,
                'selected_personal_quiz_choice_id' => $row['selectedChoiceID'] ?? null,
                'subject_id' => $subjectId,
                'bank_question_id' => $pq->questionID,
                'is_correct' => $row['isCorrect'],
                'points_possible' => $row['score'],
                'points_earned' => $row['earnedScore'],
                'question_snapshot' => [
                    'questionText' => $row['questionText'],
                    'selectedChoiceText' => $row['selectedChoiceText'],
                    'correctChoiceText' => $row['correctChoiceText'],
                    'selectedChoiceID' => $row['selectedChoiceID'] ?? null,
                    'correctChoiceID' => $row['correctChoiceID'] ?? null,
                ],
            ]);
        }
    }
}
