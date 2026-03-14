<?php

namespace Modules\PersonalClasses\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Modules\PersonalClasses\Models\ClassModel;
use Modules\PersonalClasses\Models\ClassPersonalQuiz;
use Modules\PersonalClasses\Models\ClassQuizAttempt;
use Modules\PersonalClasses\Models\ClassEnrollment;
use Modules\PersonalExams\Models\PersonalQuiz;
use Modules\PersonalExams\Models\PersonalQuizSetting;
use Modules\PersonalExams\Models\StudentQuizResult;

class ClassPersonalQuizController extends Controller
{
    /**
     * Get all quizzes assigned to a class.
     */
    public function index($classID)
    {
        try {
            $user = Auth::user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized',
                ], 401);
            }

            // Authorization:
            // - Faculty (2–5): class must belong to them
            // - Student (1): must be enrolled in the class
            $classQuery = ClassModel::where('classID', $classID);
            if ($user->roleID == 1) {
                $isEnrolled = ClassEnrollment::where('classID', $classID)
                    ->where('studentID', $user->userID)
                    ->exists();
                if (!$isEnrolled) {
                    return response()->json([
                        'success' => false,
                        'message' => 'You are not enrolled in this class.',
                    ], 403);
                }
            } else {
                $classQuery->where('facultyID', $user->userID);
            }

            $class = $classQuery->first();

            if (!$class) {
                return response()->json([
                    'success' => false,
                    'message' => 'Class not found or you do not have permission.',
                ], 404);
            }

            $classPersonalQuizzes = ClassPersonalQuiz::with([
                    'personalQuiz.subject',
                    'personalQuiz.quizType',
                    'personalQuiz.coverage',
                    'personalQuiz.creator',
                    'setting',
                ])
                ->where('classID', $classID)
                ->orderByDesc('created_at')
                ->get();

            // Format quizzes with statistics
            $quizzes = $classPersonalQuizzes->map(function ($classPersonalQuiz) use ($classID, $user) {
                $quiz = $classPersonalQuiz->personalQuiz;
                $setting = $classPersonalQuiz->setting;

                $durationMinutes = null;
                if ($setting && $setting->quizTimerEnabled && $setting->quizTimer) {
                    $durationMinutes = (int) $setting->quizTimer;
                }

                $remainingAttempts = null;
                if ($user && $user->roleID == 1 && $setting && $setting->quizAttempts) {
                    $attemptsUsed = StudentQuizResult::where('class_quiz_assignment_id', $classPersonalQuiz->classPersonalQuizID)
                        ->where('studentID', $user->userID)
                        ->count();
                    $remainingAttempts = max(0, (int) $setting->quizAttempts - (int) $attemptsUsed);
                }
                
                // Faculty-only: student list from ClassQuizAttempt
                $attempts = collect();
                if ($user && $user->roleID != 1) {
                    $attempts = ClassQuizAttempt::where('classID', $classID)
                        ->where('personalQuizID', $quiz->personalQuizID)
                        ->with('student')
                        ->get();
                }

                $studentsAnswered = $attempts->map(function ($attempt) {
                    return [
                        'studentID' => $attempt->studentID,
                        'name' => $attempt->student->firstName . ' ' . $attempt->student->lastName,
                        'score' => $attempt->score,
                        'accuracy' => $attempt->accuracy,
                        'isCompleted' => $attempt->isCompleted,
                        'completedAt' => $attempt->completedAt,
                    ];
                });

                // Get all recorded quiz results for this quiz assignment (for accurate statistics)
                $quizResults = StudentQuizResult::where('class_quiz_assignment_id', $classPersonalQuiz->classPersonalQuizID)
                    ->where('isRecorded', true)
                    ->get();

                // Calculate average accuracy from all recorded results
                $averageAccuracy = $quizResults->count() > 0
                    ? round($quizResults->avg('percentage'), 2)
                    : 0;

                // Count total attempts from all students
                $totalAttempts = $quizResults->count();

                return [
                    'personalQuiz' => $quiz,
                    'classPersonalQuizID' => $classPersonalQuiz->classPersonalQuizID,
                    'personalQuizID' => $quiz->personalQuizID,
                    'quizName' => $quiz->title,
                    'description' => $quiz->description,
                    'studentsAnswered' => $studentsAnswered,
                    'durationMinutes' => $durationMinutes,
                    'remainingAttempts' => $remainingAttempts,
                    'startDate' => $classPersonalQuiz->startDate ? $classPersonalQuiz->startDate->toDateTimeString() : null,
                    'deadlineDate' => $classPersonalQuiz->deadlineDate ? $classPersonalQuiz->deadlineDate->toDateTimeString() : null,
                    'endDate' => $classPersonalQuiz->deadlineDate ? $classPersonalQuiz->deadlineDate->toDateTimeString() : null,
                    'startTime' => $setting && $setting->startTime ? $setting->startTime->toDateTimeString() : null,
                    'endTime' => $setting && $setting->endTime ? $setting->endTime->toDateTimeString() : null,
                    'avgAccuracy' => $averageAccuracy,
                    'totalAttempts' => $totalAttempts,
                    'completedAttempts' => $attempts->where('isCompleted', true)->count(),
                ];
            });

            return response()->json([
                'success' => true,
                'message' => 'Class quizzes retrieved successfully.',
                'quizzes' => $quizzes,
                'total' => $quizzes->count(),
            ], 200);
        } catch (\Throwable $e) {
            Log::error('Error retrieving class quizzes', [
                'user_id' => optional(Auth::user())->userID,
                'class_id' => $classID,
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An error occurred while retrieving class quizzes.',
                'error' => app()->environment('local') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Get all personal quizzes created by the authenticated user
     * that are NOT yet assigned to the given class.
     * Used by the "Assign Quiz" wizard in the frontend.
     */
    public function availablePersonalQuizzes($classID)
    {
        try {
            $user = Auth::user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized',
                ], 401);
            }

            // Ensure class belongs to the authenticated faculty
            $class = ClassModel::where('classID', $classID)
                ->where('facultyID', $user->userID)
                ->first();

            if (!$class) {
                return response()->json([
                    'success' => false,
                    'message' => 'Class not found or you do not have permission.',
                ], 404);
            }

            // Get IDs of quizzes already assigned to this class
            $assignedQuizIds = ClassPersonalQuiz::where('classID', $classID)
                ->pluck('personalQuizID')
                ->toArray();

            // Fetch personal quizzes created by the user that:
            // - are not archived
            // - are not yet assigned to the class
            // - either:
            //      * subject-based and match the class subject, or
            //      * custom (no subject)
            $quizzes = PersonalQuiz::with(['subject', 'quizType', 'coverage', 'creator'])
                ->where('created_by', $user->userID)
                ->where('isArchived', false)
                ->where(function ($query) use ($class) {
                    $query->whereNull('subjectID');

                    if (!empty($class->subjectID)) {
                        $query->orWhere('subjectID', $class->subjectID);
                    }
                })
                ->when(!empty($assignedQuizIds), function ($query) use ($assignedQuizIds) {
                    $query->whereNotIn('personalQuizID', $assignedQuizIds);
                })
                ->orderByDesc('created_at')
                ->get();

            return response()->json([
                'success' => true,
                'message' => 'Available personal quizzes retrieved successfully.',
                'quizzes' => $quizzes,
                'total' => $quizzes->count(),
            ], 200);
        } catch (\Throwable $e) {
            Log::error('Error retrieving available personal quizzes for class', [
                'user_id' => optional(Auth::user())->userID,
                'class_id' => $classID,
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An error occurred while retrieving available personal quizzes.',
                'error' => app()->environment('local') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Assign a personal quiz to a class.
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
                    'classID' => 'required|exists:classes,classID',
                    'personalQuizID' => 'required|exists:personal_quizzes,personalQuizID',
                    'startDate' => 'nullable|date',
                    'deadlineDate' => 'nullable|date|after_or_equal:startDate',
                ]);
            } catch (ValidationException $e) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $e->errors(),
                ], 422);
            }

            // Verify the class belongs to the faculty
            $class = ClassModel::where('classID', $validated['classID'])
                ->where('facultyID', $user->userID)
                ->first();

            if (!$class) {
                return response()->json([
                    'success' => false,
                    'message' => 'Class not found or you do not have permission.',
                ], 404);
            }

            // Verify the personal quiz belongs to the faculty
            $personalQuiz = PersonalQuiz::where('personalQuizID', $validated['personalQuizID'])
                ->where('created_by', $user->userID)
                ->first();

            if (!$personalQuiz) {
                return response()->json([
                    'success' => false,
                    'message' => 'Personal quiz not found or you do not have permission.',
                ], 404);
            }

            // Check if quiz is already assigned to this class
            $existing = ClassPersonalQuiz::where('classID', $validated['classID'])
                ->where('personalQuizID', $validated['personalQuizID'])
                ->first();

            if ($existing) {
                return response()->json([
                    'success' => false,
                    'message' => 'This quiz is already assigned to this class.',
                ], 422);
            }

            // Create assignment
            $classPersonalQuiz = ClassPersonalQuiz::create([
                'classID' => $validated['classID'],
                'personalQuizID' => $validated['personalQuizID'],
                'startDate' => $validated['startDate'] ?? null,
                'deadlineDate' => $validated['deadlineDate'] ?? null,
            ]);

            $classPersonalQuiz->load(['personalQuiz', 'class']);

            return response()->json([
                'success' => true,
                'message' => 'Quiz assigned to class successfully.',
                'classPersonalQuiz' => $classPersonalQuiz,
            ], 201);
        } catch (\Throwable $e) {
            Log::error('Error assigning quiz to class', [
                'user_id' => optional(Auth::user())->userID,
                'payload' => $request->all(),
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An internal error occurred while assigning the quiz.',
                'error' => app()->environment('local') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Update quiz assignment (start date, deadline date).
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

            $classPersonalQuiz = ClassPersonalQuiz::with('class')
                ->where('classPersonalQuizID', $classPersonalQuizID)
                ->first();

            if (!$classPersonalQuiz) {
                return response()->json([
                    'success' => false,
                    'message' => 'Quiz assignment not found.',
                ], 404);
            }

            // Verify the class belongs to the faculty
            if ($classPersonalQuiz->class->facultyID != $user->userID) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to update this quiz assignment.',
                ], 403);
            }

            try {
                $validated = $request->validate([
                    'startDate' => 'nullable|date',
                    'deadlineDate' => 'nullable|date|after_or_equal:startDate',
                ]);
            } catch (ValidationException $e) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $e->errors(),
                ], 422);
            }

            $classPersonalQuiz->update($validated);
            $classPersonalQuiz->load(['personalQuiz', 'class']);

            return response()->json([
                'success' => true,
                'message' => 'Quiz assignment updated successfully.',
                'classPersonalQuiz' => $classPersonalQuiz,
            ], 200);
        } catch (\Throwable $e) {
            Log::error('Error updating quiz assignment', [
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
                'message' => 'An internal error occurred while updating the quiz assignment.',
                'error' => app()->environment('local') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Get all quizzes assigned to a class (Student view).
     * Students can only view quizzes for classes they are enrolled in.
     */
    public function studentQuizzes($classID)
    {
        try {
            $user = Auth::user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized',
                ], 401);
            }

            // Check if user is a student (roleID 1)
            if ($user->roleID != 1) {
                return response()->json([
                    'success' => false,
                    'message' => 'Only students can view class quizzes.',
                ], 403);
            }

            // Verify the student is enrolled in the class
            $enrollment = ClassEnrollment::where('classID', $classID)
                ->where('studentID', $user->userID)
                ->first();

            if (!$enrollment) {
                return response()->json([
                    'success' => false,
                    'message' => 'You are not enrolled in this class.',
                ], 403);
            }

            // Get the class details
            $class = ClassModel::where('classID', $classID)
                ->where('isActive', true)
                ->with(['subject', 'faculty'])
                ->first();

            if (!$class) {
                return response()->json([
                    'success' => false,
                    'message' => 'Class not found or is not active.',
                ], 404);
            }

            // Get all quizzes assigned to this class
            $classPersonalQuizzes = ClassPersonalQuiz::with([
                    'personalQuiz.subject',
                    'personalQuiz.quizType',
                    'personalQuiz.coverage',
                    'personalQuiz.creator',
                    'setting',
                ])
                ->where('classID', $classID)
                ->orderByDesc('created_at')
                ->get();

            // Format quizzes with student-specific information
            $quizzes = $classPersonalQuizzes->map(function ($classPersonalQuiz) use ($user, $classID) {
                $quiz = $classPersonalQuiz->personalQuiz;
                $setting = $classPersonalQuiz->setting;

                // Get student's attempt for this quiz
                $studentAttempt = ClassQuizAttempt::where('classID', $classID)
                    ->where('personalQuizID', $quiz->personalQuizID)
                    ->where('studentID', $user->userID)
                    ->first();

                // Determine quiz availability based on settings and class assignment dates
                $now = now();
                $isAvailable = true;
                $availabilityMessage = null;

                // Check class-level dates (startDate and deadlineDate from ClassPersonalQuiz)
                if ($classPersonalQuiz->startDate && $now < $classPersonalQuiz->startDate) {
                    $isAvailable = false;
                    $availabilityMessage = 'Quiz is not yet available. It will be available on ' . $classPersonalQuiz->startDate->format('M d, Y H:i');
                } elseif ($classPersonalQuiz->deadlineDate && $now > $classPersonalQuiz->deadlineDate) {
                    $isAvailable = false;
                    $availabilityMessage = 'Quiz deadline has passed.';
                }

                // Check quiz-level settings (startTime and endTime from PersonalQuizSetting)
                if ($setting) {
                    if ($setting->startTime && $now < $setting->startTime) {
                        $isAvailable = false;
                        $availabilityMessage = 'Quiz is not yet available. It will be available on ' . $setting->startTime->format('M d, Y H:i');
                    } elseif ($setting->endTime && $now > $setting->endTime) {
                        if (!$setting->allowLateSubmission) {
                            $isAvailable = false;
                            $availabilityMessage = 'Quiz deadline has passed.';
                        }
                    }
                }

                // Check attempt limit
                $canAttempt = true;
                if ($setting && $setting->quizAttempts) {
                    $attemptCount = ClassQuizAttempt::where('classID', $classID)
                        ->where('personalQuizID', $quiz->personalQuizID)
                        ->where('studentID', $user->userID)
                        ->count();

                    if ($attemptCount >= $setting->quizAttempts) {
                        $canAttempt = false;
                        if (!$isAvailable) {
                            $availabilityMessage = 'You have reached the maximum number of attempts for this quiz.';
                        }
                    }
                }

                return [
                    'personalQuiz' => $quiz,
                    'classPersonalQuizID' => $classPersonalQuiz->classPersonalQuizID,
                    'personalQuizID' => $quiz->personalQuizID,
                    'quizName' => $quiz->title,
                    'description' => $quiz->description,
                    'instruction' => $quiz->instruction,
                    'startDate' => $classPersonalQuiz->startDate,
                    'deadlineDate' => $classPersonalQuiz->deadlineDate,
                    'settings' => $setting ? [
                        'startTime' => $setting->startTime,
                        'endTime' => $setting->endTime,
                        'quizAttempts' => $setting->quizAttempts,
                        'quizTimer' => $setting->quizTimer,
                        'quizTimerEnabled' => $setting->quizTimerEnabled,
                        'shuffleQuestions' => $setting->shuffleQuestions,
                        'shuffleChoices' => $setting->shuffleChoices,
                        'showCorrectAnswers' => $setting->showCorrectAnswers,
                        'autoSubmitOnTimeout' => $setting->autoSubmitOnTimeout,
                        'allowLateSubmission' => $setting->allowLateSubmission,
                        'showScoreAfterQuiz' => $setting->showScoreAfterQuiz,
                    ] : null,
                    'studentAttempt' => $studentAttempt ? [
                        'attemptID' => $studentAttempt->attemptID,
                        'score' => $studentAttempt->score,
                        'totalScore' => $studentAttempt->totalScore,
                        'accuracy' => $studentAttempt->accuracy,
                        'isCompleted' => $studentAttempt->isCompleted,
                        'startedAt' => $studentAttempt->startedAt,
                        'completedAt' => $studentAttempt->completedAt,
                    ] : null,
                    'isAvailable' => $isAvailable && $canAttempt,
                    'canAttempt' => $canAttempt,
                    'availabilityMessage' => $availabilityMessage,
                ];
            });

            return response()->json([
                'success' => true,
                'message' => 'Class quizzes retrieved successfully.',
                'class' => [
                    'classID' => $class->classID,
                    'className' => $class->className,
                    'classCode' => $class->classCode,
                    'subject' => $class->subject ? [
                        'subjectID' => $class->subject->subjectID,
                        'subjectCode' => $class->subject->subjectCode,
                        'subjectName' => $class->subject->subjectName,
                    ] : null,
                    'faculty' => $class->faculty ? [
                        'userID' => $class->faculty->userID,
                        'firstName' => $class->faculty->firstName,
                        'lastName' => $class->faculty->lastName,
                    ] : null,
                ],
                'quizzes' => $quizzes,
                'total' => $quizzes->count(),
            ], 200);
        } catch (\Throwable $e) {
            Log::error('Error retrieving student class quizzes', [
                'user_id' => optional(Auth::user())->userID,
                'class_id' => $classID,
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An error occurred while retrieving class quizzes.',
                'error' => app()->environment('local') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Update start date and deadline date for a quiz assignment.
     * Dedicated function for changing quiz dates.
     */
    public function updateDates(Request $request, $classPersonalQuizID)
    {
        try {
            $user = Auth::user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized',
                ], 401);
            }

            $classPersonalQuiz = ClassPersonalQuiz::with('class')
                ->where('classPersonalQuizID', $classPersonalQuizID)
                ->first();

            if (!$classPersonalQuiz) {
                return response()->json([
                    'success' => false,
                    'message' => 'Quiz assignment not found.',
                ], 404);
            }

            // Verify the class belongs to the faculty
            if ($classPersonalQuiz->class->facultyID != $user->userID) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to update this quiz assignment.',
                ], 403);
            }

            try {
                $validated = $request->validate([
                    'startDate' => 'nullable|date',
                    'deadlineDate' => 'nullable|date|after_or_equal:startDate',
                ]);
            } catch (ValidationException $e) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $e->errors(),
                ], 422);
            }

            // Store old values for logging
            $oldStartDate = $classPersonalQuiz->startDate;
            $oldDeadlineDate = $classPersonalQuiz->deadlineDate;

            // Update only the dates
            $classPersonalQuiz->update([
                'startDate' => $validated['startDate'] ?? $classPersonalQuiz->startDate,
                'deadlineDate' => $validated['deadlineDate'] ?? $classPersonalQuiz->deadlineDate,
            ]);

            // Reload relationships
            $classPersonalQuiz->load(['personalQuiz', 'class']);

            return response()->json([
                'success' => true,
                'message' => 'Quiz dates updated successfully.',
                'classPersonalQuiz' => [
                    'classPersonalQuizID' => $classPersonalQuiz->classPersonalQuizID,
                    'classID' => $classPersonalQuiz->classID,
                    'personalQuizID' => $classPersonalQuiz->personalQuizID,
                    'startDate' => $classPersonalQuiz->startDate ? $classPersonalQuiz->startDate->toDateTimeString() : null,
                    'deadlineDate' => $classPersonalQuiz->deadlineDate ? $classPersonalQuiz->deadlineDate->toDateTimeString() : null,
                    'previousStartDate' => $oldStartDate ? $oldStartDate->toDateTimeString() : null,
                    'previousDeadlineDate' => $oldDeadlineDate ? $oldDeadlineDate->toDateTimeString() : null,
                ],
            ], 200);
        } catch (\Throwable $e) {
            Log::error('Error updating quiz dates', [
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
                'message' => 'An internal error occurred while updating the quiz dates.',
                'error' => app()->environment('local') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Remove a quiz from a class.
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

            $classPersonalQuiz = ClassPersonalQuiz::with('class')
                ->where('classPersonalQuizID', $classPersonalQuizID)
                ->first();

            if (!$classPersonalQuiz) {
                return response()->json([
                    'success' => false,
                    'message' => 'Quiz assignment not found.',
                ], 404);
            }

            // Verify the class belongs to the faculty
            if ($classPersonalQuiz->class->facultyID != $user->userID) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to remove this quiz assignment.',
                ], 403);
            }

            // Store quiz info for response before deletion
            $quizInfo = [
                'classPersonalQuizID' => $classPersonalQuiz->classPersonalQuizID,
                'classID' => $classPersonalQuiz->classID,
                'personalQuizID' => $classPersonalQuiz->personalQuizID,
            ];

            $classPersonalQuiz->delete();

            return response()->json([
                'success' => true,
                'message' => 'Quiz removed from class successfully.',
                'deletedQuiz' => $quizInfo,
            ], 200);
        } catch (\Throwable $e) {
            Log::error('Error removing quiz from class', [
                'user_id' => optional(Auth::user())->userID,
                'class_personal_quiz_id' => $classPersonalQuizID,
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An internal error occurred while removing the quiz.',
                'error' => app()->environment('local') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Get all classes created by the faculty for a specific personal quiz.
     * Used when faculty clicks "Assign Class" button in a personal quiz.
     * Returns classes with information about whether the quiz is already assigned.
     */
    public function getClassesForQuiz($personalQuizID)
    {
        try {
            $user = Auth::user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized',
                ], 401);
            }

            // Verify the personal quiz belongs to the faculty
            $personalQuiz = PersonalQuiz::where('personalQuizID', $personalQuizID)
                ->where('created_by', $user->userID)
                ->first();

            if (!$personalQuiz) {
                return response()->json([
                    'success' => false,
                    'message' => 'Personal quiz not found or you do not have permission.',
                ], 404);
            }

            // Get all classes created by the faculty
            $classes = ClassModel::with(['subject', 'faculty'])
                ->where('facultyID', $user->userID)
                ->where('isActive', true)
                ->orderByDesc('created_at')
                ->get();

            // Get IDs of classes that already have this quiz assigned
            $assignedClassIds = ClassPersonalQuiz::where('personalQuizID', $personalQuizID)
                ->pluck('classID')
                ->toArray();

            // Format classes with assignment status
            $formattedClasses = $classes->map(function ($class) use ($assignedClassIds, $personalQuizID) {
                $isAssigned = in_array($class->classID, $assignedClassIds);
                
                // Get assignment details if already assigned
                $assignment = null;
                if ($isAssigned) {
                    $assignment = ClassPersonalQuiz::where('classID', $class->classID)
                        ->where('personalQuizID', $personalQuizID)
                        ->first();
                }

                return [
                    'classID' => $class->classID,
                    'className' => $class->className,
                    'classCode' => $class->classCode,
                    'description' => $class->description,
                    'schedule' => $class->schedule,
                    'subject' => $class->subject ? [
                        'subjectID' => $class->subject->subjectID,
                        'subjectCode' => $class->subject->subjectCode,
                        'subjectName' => $class->subject->subjectName,
                    ] : null,
                    'isAssigned' => $isAssigned,
                    'assignment' => $assignment ? [
                        'classPersonalQuizID' => $assignment->classPersonalQuizID,
                        'startDate' => $assignment->startDate,
                        'deadlineDate' => $assignment->deadlineDate,
                        'assignedAt' => $assignment->created_at,
                    ] : null,
                ];
            });

            return response()->json([
                'success' => true,
                'message' => 'Classes retrieved successfully.',
                'personalQuiz' => [
                    'personalQuizID' => $personalQuiz->personalQuizID,
                    'title' => $personalQuiz->title,
                    'description' => $personalQuiz->description,
                ],
                'classes' => $formattedClasses,
                'total' => $formattedClasses->count(),
                'assignedCount' => count($assignedClassIds),
            ], 200);
        } catch (\Throwable $e) {
            Log::error('Error retrieving classes for personal quiz', [
                'user_id' => optional(Auth::user())->userID,
                'personal_quiz_id' => $personalQuizID,
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An error occurred while retrieving classes.',
                'error' => app()->environment('local') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Assign a personal quiz to multiple classes.
     * Used when faculty selects one or multiple classes to assign a quiz to.
     */
    public function assignQuizToClasses(Request $request, $personalQuizID)
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
                    'classIDs' => 'required|array|min:1',
                    'classIDs.*' => 'required|exists:classes,classID',
                    'startDate' => 'nullable|date',
                    'deadlineDate' => 'nullable|date|after_or_equal:startDate',
                ]);
            } catch (ValidationException $e) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $e->errors(),
                ], 422);
            }

            // Verify the personal quiz belongs to the faculty
            $personalQuiz = PersonalQuiz::where('personalQuizID', $personalQuizID)
                ->where('created_by', $user->userID)
                ->first();

            if (!$personalQuiz) {
                return response()->json([
                    'success' => false,
                    'message' => 'Personal quiz not found or you do not have permission.',
                ], 404);
            }

            $assigned = [];
            $skipped = [];
            $errors = [];

            foreach ($validated['classIDs'] as $classID) {
                try {
                    // Verify the class belongs to the faculty
                    $class = ClassModel::where('classID', $classID)
                        ->where('facultyID', $user->userID)
                        ->first();

                    if (!$class) {
                        $skipped[] = [
                            'classID' => $classID,
                            'reason' => 'Class not found or you do not have permission.',
                        ];
                        continue;
                    }

                    // Check if quiz is already assigned to this class
                    $existing = ClassPersonalQuiz::where('classID', $classID)
                        ->where('personalQuizID', $personalQuizID)
                        ->first();

                    if ($existing) {
                        $skipped[] = [
                            'classID' => $classID,
                            'className' => $class->className,
                            'reason' => 'Quiz is already assigned to this class.',
                        ];
                        continue;
                    }

                    // Create assignment
                    $classPersonalQuiz = ClassPersonalQuiz::create([
                        'classID' => $classID,
                        'personalQuizID' => $personalQuizID,
                        'startDate' => $validated['startDate'] ?? null,
                        'deadlineDate' => $validated['deadlineDate'] ?? null,
                    ]);

                    $assigned[] = [
                        'classID' => $classID,
                        'className' => $class->className,
                        'classPersonalQuizID' => $classPersonalQuiz->classPersonalQuizID,
                    ];
                } catch (\Throwable $e) {
                    Log::error('Error assigning quiz to class', [
                        'user_id' => $user->userID,
                        'class_id' => $classID,
                        'personal_quiz_id' => $personalQuizID,
                        'error' => $e->getMessage(),
                        'file' => $e->getFile(),
                        'line' => $e->getLine(),
                    ]);

                    $errors[] = [
                        'classID' => $classID,
                        'error' => 'An error occurred while assigning the quiz to this class.',
                    ];
                }
            }

            $response = [
                'success' => true,
                'message' => count($assigned) > 0 
                    ? 'Quiz assignment completed successfully.' 
                    : 'No classes were assigned.',
                'assigned' => $assigned,
                'assignedCount' => count($assigned),
            ];

            if (count($skipped) > 0) {
                $response['skipped'] = $skipped;
                $response['skippedCount'] = count($skipped);
            }

            if (count($errors) > 0) {
                $response['errors'] = $errors;
                $response['errorCount'] = count($errors);
            }

            $statusCode = count($assigned) > 0 ? 201 : 200;
            return response()->json($response, $statusCode);

        } catch (\Throwable $e) {
            Log::error('Error assigning quiz to multiple classes', [
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
                'message' => 'An internal error occurred while assigning the quiz.',
                'error' => app()->environment('local') ? $e->getMessage() : null,
            ], 500);
        }
    }
}

