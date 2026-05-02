<?php

namespace Modules\PersonalExams\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Modules\PersonalClasses\Models\ClassPersonalQuiz;
use Modules\PersonalClasses\Models\ClassEnrollment;
use Modules\PersonalClasses\Models\ClassModel;
use Modules\PersonalExams\Models\StudentQuizResult;
use Modules\PersonalExams\Models\PersonalQuiz;

class QuizSessionController extends Controller
{
    /**
     * Get all quiz sessions for a student (ongoing, completed, missed).
     */
    public function studentSessions()
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return response()->json(['success' => false, 'message' => 'Unauthorized'], 401);
            }

            if ($user->roleID != 1) {
                return response()->json(['success' => false, 'message' => 'Only students can view quiz sessions.'], 403);
            }

            // Get all classes the student is enrolled in
            $enrollments = ClassEnrollment::with(['class.faculty'])
                ->where('studentID', $user->userID)
                ->get();

            if ($enrollments->isEmpty()) {
                return response()->json([
                    'success' => true,
                    'message' => 'No quiz sessions found.',
                    'ongoing' => [],
                    'completed' => [],
                    'missed' => [],
                    'upcoming' => [],
                ], 200);
            }

            $classIDs = $enrollments->pluck('classID')->toArray();

            // Get all quiz assignments for these classes (with per-class settings)
            $quizAssignments = ClassPersonalQuiz::with([
                'setting',
                'personalQuiz.subject',
                'personalQuiz.quizType',
                'class.faculty'
            ])
                ->whereIn('classID', $classIDs)
                ->get();

            // Get all results for this student
            $studentResults = StudentQuizResult::where('studentID', $user->userID)
                ->whereIn('class_quiz_assignment_id', $quizAssignments->pluck('classPersonalQuizID'))
                ->get()
                ->groupBy('class_quiz_assignment_id');

            $now = now();
            $ongoing = [];
            $completed = [];
            $missed = [];
            $upcoming = [];

            foreach ($quizAssignments as $assignment) {
                $quiz = $assignment->personalQuiz;
                $settings = $assignment->setting;
                $results = $studentResults->get($assignment->classPersonalQuizID, collect());

                // Determine effective start and end dates
                $effectiveStartDate = $assignment->startDate;
                $effectiveEndDate = $assignment->deadlineDate;

                if ($settings) {
                    if ($settings->startTime && (!$effectiveStartDate || $settings->startTime > $effectiveStartDate)) {
                        $effectiveStartDate = $settings->startTime;
                    }
                    if ($settings->endTime && (!$effectiveEndDate || $settings->endTime < $effectiveEndDate)) {
                        $effectiveEndDate = $settings->endTime;
                    }
                }

                // Check if student has completed this quiz
                $hasCompleted = $results->isNotEmpty();
                $highestResult = $hasCompleted ? $results->sortByDesc(function($r) {
                    return [$r->percentage, $r->score];
                })->first() : null;

                // Check attempt limits
                $canRetake = true;
                if ($settings && $settings->quizAttempts) {
                    $attemptCount = $results->count();
                    $canRetake = $attemptCount < $settings->quizAttempts;
                }

                // Determine status
                $isUpcoming = $effectiveStartDate && $now < $effectiveStartDate;
                
                // Ongoing: available now, not past deadline (or late submission allowed), and can still take/retake
                $isOngoing = (!$effectiveStartDate || $now >= $effectiveStartDate) && 
                            (!$effectiveEndDate || $now <= $effectiveEndDate || ($settings && $settings->allowLateSubmission)) && 
                            (!$hasCompleted || $canRetake);
                
                // Completed: has taken quiz and either reached attempt limit or deadline passed (and no late submission)
                $isCompleted = $hasCompleted && (
                    !$canRetake || 
                    ($effectiveEndDate && $now > $effectiveEndDate && (!$settings || !$settings->allowLateSubmission))
                );
                
                // Missed: hasn't taken, deadline passed, and late submission not allowed
                $isMissed = !$hasCompleted && 
                           $effectiveEndDate && 
                           $now > $effectiveEndDate && 
                           (!$settings || !$settings->allowLateSubmission);

                $quizData = [
                    'classPersonalQuizID' => $assignment->classPersonalQuizID,
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
                    'class' => [
                        'classID' => $assignment->class->classID,
                        'className' => $assignment->class->className,
                        'classCode' => $assignment->class->classCode,
                        'faculty' => $assignment->class->faculty ? [
                            'userID' => $assignment->class->faculty->userID,
                            'firstName' => $assignment->class->faculty->firstName,
                            'lastName' => $assignment->class->faculty->lastName,
                        ] : null,
                    ],
                    'assignment' => [
                        'startDate' => $assignment->startDate,
                        'deadlineDate' => $assignment->deadlineDate,
                        'effectiveStartDate' => $effectiveStartDate,
                        'effectiveEndDate' => $effectiveEndDate,
                    ],
                    'settings' => $settings ? [
                        'quizTimer' => $settings->quizTimer,
                        'quizTimerEnabled' => $settings->quizTimerEnabled,
                        'quizAttempts' => $settings->quizAttempts,
                        'allowLateSubmission' => $settings->allowLateSubmission,
                    ] : null,
                    'studentStatus' => [
                        'hasCompleted' => $hasCompleted,
                        'attemptCount' => $results->count(),
                        'canRetake' => $canRetake,
                        'highestScore' => $highestResult ? $highestResult->score : null,
                        'highestPercentage' => $highestResult ? $highestResult->percentage : null,
                        'highestAttempt' => $highestResult ? $highestResult->attempt_number : null,
                    ],
                    'timeRemaining' => $effectiveEndDate ? [
                        'seconds' => max(0, $now->diffInSeconds($effectiveEndDate, false)),
                        'minutes' => max(0, $now->diffInMinutes($effectiveEndDate, false)),
                        'hours' => max(0, $now->diffInHours($effectiveEndDate, false)),
                        'days' => max(0, $now->diffInDays($effectiveEndDate, false)),
                        'isPastDeadline' => $now > $effectiveEndDate,
                    ] : null,
                ];

                if ($isUpcoming) {
                    $upcoming[] = $quizData;
                } elseif ($isOngoing) {
                    $ongoing[] = $quizData;
                } elseif ($isCompleted) {
                    $completed[] = $quizData;
                } elseif ($isMissed) {
                    $missed[] = $quizData;
                }
            }

            // Sort by deadline date (soonest first for ongoing/upcoming, most recent for completed/missed)
            usort($ongoing, function($a, $b) {
                $dateA = $a['assignment']['effectiveEndDate'] ?? $a['assignment']['deadlineDate'];
                $dateB = $b['assignment']['effectiveEndDate'] ?? $b['assignment']['deadlineDate'];
                if (!$dateA) return 1;
                if (!$dateB) return -1;
                return $dateA <=> $dateB;
            });

            usort($upcoming, function($a, $b) {
                $dateA = $a['assignment']['effectiveStartDate'] ?? $a['assignment']['startDate'];
                $dateB = $b['assignment']['effectiveStartDate'] ?? $b['assignment']['startDate'];
                if (!$dateA) return 1;
                if (!$dateB) return -1;
                return $dateA <=> $dateB;
            });

            usort($completed, function($a, $b) {
                $dateA = $a['assignment']['effectiveEndDate'] ?? $a['assignment']['deadlineDate'];
                $dateB = $b['assignment']['effectiveEndDate'] ?? $b['assignment']['deadlineDate'];
                if (!$dateA) return 1;
                if (!$dateB) return -1;
                return $dateB <=> $dateA; // Reverse for most recent first
            });

            usort($missed, function($a, $b) {
                $dateA = $a['assignment']['effectiveEndDate'] ?? $a['assignment']['deadlineDate'];
                $dateB = $b['assignment']['effectiveEndDate'] ?? $b['assignment']['deadlineDate'];
                if (!$dateA) return 1;
                if (!$dateB) return -1;
                return $dateB <=> $dateA; // Reverse for most recent first
            });

            return response()->json([
                'success' => true,
                'message' => 'Quiz sessions retrieved successfully.',
                'ongoing' => $ongoing,
                'completed' => $completed,
                'missed' => $missed,
                'upcoming' => $upcoming,
                'summary' => [
                    'totalOngoing' => count($ongoing),
                    'totalCompleted' => count($completed),
                    'totalMissed' => count($missed),
                    'totalUpcoming' => count($upcoming),
                ],
            ], 200);
        } catch (\Throwable $e) {
            Log::error('Error retrieving student quiz sessions', [
                'user_id' => optional(Auth::user())->userID,
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An error occurred while retrieving quiz sessions.',
                'error' => app()->environment('local') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Get quiz sessions for a faculty member's classes.
     */
    public function facultySessions(Request $request)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return response()->json(['success' => false, 'message' => 'Unauthorized'], 401);
            }

            if (!in_array($user->roleID, [2, 3, 4, 5])) {
                return response()->json(['success' => false, 'message' => 'Only faculty can view quiz sessions.'], 403);
            }

            // Filter by class if provided
            $classID = $request->input('classID');

            // Get classes owned by this faculty user (user-specific sessions)
            $classesQuery = ClassModel::with(['enrollments.student'])
                ->where('facultyID', $user->userID);

            if ($classID) {
                $classesQuery->where('classID', $classID);
            }
            $classes = $classesQuery->get();

            if ($classes->isEmpty()) {
                return response()->json([
                    'success' => true,
                    'message' => 'No classes found.',
                    'sessions' => [],
                ], 200);
            }

            $classIDs = $classes->pluck('classID')->toArray();

            // Get all quiz assignments for these classes (with per-class settings)
            $quizAssignments = ClassPersonalQuiz::with([
                'setting',
                'personalQuiz.subject',
                'personalQuiz.quizType',
                'class.faculty',
                'studentQuizResults.student'
            ])
                ->whereIn('classID', $classIDs)
                ->get();

            // Get all enrollments for these classes
            $enrollments = ClassEnrollment::whereIn('classID', $classIDs)
                ->with('student')
                ->get()
                ->groupBy('classID');

            $now = now();
            $sessions = [];

            foreach ($quizAssignments as $assignment) {
                $quiz = $assignment->personalQuiz;
                $settings = $assignment->setting;
                $class = $assignment->class;

                // Determine effective start and end dates
                $effectiveStartDate = $assignment->startDate;
                $effectiveEndDate = $assignment->deadlineDate;

                if ($settings) {
                    if ($settings->startTime && (!$effectiveStartDate || $settings->startTime > $effectiveStartDate)) {
                        $effectiveStartDate = $settings->startTime;
                    }
                    if ($settings->endTime && (!$effectiveEndDate || $settings->endTime < $effectiveEndDate)) {
                        $effectiveEndDate = $settings->endTime;
                    }
                }

                // Get all results for this quiz
                $allResults = $assignment->studentQuizResults;
                $studentsWhoCompleted = $allResults->pluck('studentID')->unique();
                $totalAttempts = $allResults->count();

                // Get enrolled students for this class
                $enrolledStudents = $enrollments->get($class->classID, collect());
                $totalEnrolled = $enrolledStudents->count();
                $completedCount = $studentsWhoCompleted->count();
                $notCompletedCount = $totalEnrolled - $completedCount;

                // Calculate statistics
                $averageScore = $allResults->isNotEmpty() ? $allResults->avg('score') : 0;
                $averagePercentage = $allResults->isNotEmpty() ? $allResults->avg('percentage') : 0;
                $passRate = $allResults->isNotEmpty() ? ($allResults->where('isPassed', true)->count() / $allResults->count()) * 100 : 0;

                // Determine status
                $isUpcoming = $effectiveStartDate && $now < $effectiveStartDate;
                $isOngoing = (!$effectiveStartDate || $now >= $effectiveStartDate) && 
                            (!$effectiveEndDate || $now <= $effectiveEndDate);
                $isCompleted = $effectiveEndDate && $now > $effectiveEndDate;

                $sessions[] = [
                    'classPersonalQuizID' => $assignment->classPersonalQuizID,
                    'quiz' => [
                        'personalQuizID' => $quiz->personalQuizID,
                        'title' => $quiz->title,
                        'description' => $quiz->description,
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
                    'class' => [
                        'classID' => $class->classID,
                        'className' => $class->className,
                        'classCode' => $class->classCode,
                    ],
                    'assignment' => [
                        'startDate' => $assignment->startDate,
                        'deadlineDate' => $assignment->deadlineDate,
                        'effectiveStartDate' => $effectiveStartDate,
                        'effectiveEndDate' => $effectiveEndDate,
                    ],
                    'settings' => $settings ? [
                        'quizTimer' => $settings->quizTimer,
                        'quizTimerEnabled' => $settings->quizTimerEnabled,
                        'quizAttempts' => $settings->quizAttempts,
                        'allowLateSubmission' => $settings->allowLateSubmission,
                    ] : null,
                    'status' => [
                        'isUpcoming' => $isUpcoming,
                        'isOngoing' => $isOngoing,
                        'isCompleted' => $isCompleted,
                    ],
                    'statistics' => [
                        'totalEnrolled' => $totalEnrolled,
                        'completedCount' => $completedCount,
                        'notCompletedCount' => $notCompletedCount,
                        'completionRate' => $totalEnrolled > 0 ? ($completedCount / $totalEnrolled) * 100 : 0,
                        'totalAttempts' => $totalAttempts,
                        'averageScore' => round($averageScore, 2),
                        'averagePercentage' => round($averagePercentage, 2),
                        'passRate' => round($passRate, 2),
                    ],
                    'timeRemaining' => $effectiveEndDate ? [
                        'seconds' => max(0, $now->diffInSeconds($effectiveEndDate, false)),
                        'minutes' => max(0, $now->diffInMinutes($effectiveEndDate, false)),
                        'hours' => max(0, $now->diffInHours($effectiveEndDate, false)),
                        'days' => max(0, $now->diffInDays($effectiveEndDate, false)),
                        'isPastDeadline' => $now > $effectiveEndDate,
                    ] : null,
                ];
            }

            // Sort by deadline date
            usort($sessions, function($a, $b) {
                $dateA = $a['assignment']['effectiveEndDate'] ?? $a['assignment']['deadlineDate'];
                $dateB = $b['assignment']['effectiveEndDate'] ?? $b['assignment']['deadlineDate'];
                if (!$dateA) return 1;
                if (!$dateB) return -1;
                return $dateA <=> $dateB;
            });

            return response()->json([
                'success' => true,
                'message' => 'Quiz sessions retrieved successfully.',
                'sessions' => $sessions,
                'total' => count($sessions),
            ], 200);
        } catch (\Throwable $e) {
            Log::error('Error retrieving faculty quiz sessions', [
                'user_id' => optional(Auth::user())->userID,
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An error occurred while retrieving quiz sessions.',
                'error' => app()->environment('local') ? $e->getMessage() : null,
            ], 500);
        }
    }
}

