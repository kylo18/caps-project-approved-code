<?php

namespace Modules\PersonalExams\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Modules\PersonalExams\Models\PersonalQuiz;
use Modules\PersonalExams\Models\StudentQuizResult;
use Modules\PersonalClasses\Models\ClassPersonalQuiz;
use Modules\Users\Models\User;
use Modules\Users\Models\Student;

class PersonalQuizLeaderboardController extends Controller
{
    /**
     * Get leaderboard for a personal quiz.
     * Returns data regardless of which class the quiz is assigned to.
     * Returns: name, course, year, student id, highest score and percentage, attempts.
     * Only accessible by faculty (roleID 2,3,4,5).
     */
    public function leaderboard(Request $request, $personalQuizID)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return response()->json(['success' => false, 'message' => 'Unauthorized'], 401);
            }

            // Check if user is faculty (roleID 2,3,4,5)
            if (!in_array($user->roleID, [2, 3, 4, 5])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Only faculty members can access this feature.',
                ], 403);
            }

            // Validate personal quiz exists
            $personalQuiz = PersonalQuiz::with(['subject', 'quizType', 'creator'])
                ->find($personalQuizID);

            if (!$personalQuiz) {
                return response()->json([
                    'success' => false,
                    'message' => 'Personal quiz not found.',
                ], 404);
            }

            // Verify user has access to this quiz
            $hasAccess = false;
            if ($personalQuiz->created_by === $user->userID) {
                $hasAccess = true;
            } elseif (in_array($user->roleID, [3, 4, 5])) {
                $hasAccess = true;
            }

            if (!$hasAccess) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to access this quiz.',
                ], 403);
            }

            // Get all class quiz assignments for this personal quiz
            $classQuizAssignments = ClassPersonalQuiz::where('personalQuizID', $personalQuizID)
                ->pluck('classPersonalQuizID')
                ->toArray();

            if (empty($classQuizAssignments)) {
                return response()->json([
                    'success' => true,
                    'message' => 'This quiz is not assigned to any classes yet.',
                    'leaderboard' => [],
                    'quiz' => [
                        'personalQuizID' => $personalQuiz->personalQuizID,
                        'title' => $personalQuiz->title,
                    ],
                ], 200);
            }

            // Get all results for this quiz across all classes
            $results = StudentQuizResult::with(['student' => function($query) {
                $query->with('program');
            }, 'classQuizAssignment'])
                ->whereIn('class_quiz_assignment_id', $classQuizAssignments)
                ->get();

            if ($results->isEmpty()) {
                return response()->json([
                    'success' => true,
                    'message' => 'No quiz results found for this quiz.',
                    'leaderboard' => [],
                    'quiz' => [
                        'personalQuizID' => $personalQuiz->personalQuizID,
                        'title' => $personalQuiz->title,
                    ],
                ], 200);
            }

            // Get all userCodes from results
            $userCodes = $results->pluck('student.userCode')->filter()->unique()->toArray();

            // Get student information (year level) for these users
            $students = Student::whereIn('userCode', $userCodes)
                ->get()
                ->keyBy('userCode');

            // Group by student and calculate highest score and attempts
            $leaderboardData = $results->groupBy('studentID')->map(function($records, $studentID) use ($students) {
                $student = $records->first()->student;
                if (!$student) {
                    return null;
                }

                // Find highest score (by percentage, then by score)
                $highestResult = $records->sortByDesc(function($record) {
                    return [$record->percentage, $record->score];
                })->first();

                // Get student info for year level
                $studentInfo = $students->get($student->userCode);

                return [
                    'userID' => $studentID,
                    'studentID' => $student->userCode,
                    'name' => trim($student->firstName . ' ' . $student->lastName),
                    'firstName' => $student->firstName,
                    'lastName' => $student->lastName,
                    'course' => $student->program ? $student->program->programName : 'N/A',
                    'programID' => $student->programID,
                    'year' => $studentInfo ? $studentInfo->yearLevel : null,
                    'yearLevel' => $studentInfo ? $studentInfo->yearLevel : null,
                    'highestScore' => $highestResult->score,
                    'totalScore' => $highestResult->total_score,
                    'highestPercentage' => round($highestResult->percentage, 2),
                    'attempts' => $records->count(),
                    'lastAttemptDate' => $records->max('submitted_at') ?? $records->max('created_at'),
                ];
            })->filter()->values();

            // Sort by highest percentage (descending), then by highest score, then by attempts
            $leaderboardData = $leaderboardData->sortByDesc(function($item) {
                return [$item['highestPercentage'], $item['highestScore'], $item['attempts']];
            })->values();

            return response()->json([
                'success' => true,
                'message' => 'Leaderboard retrieved successfully.',
                'leaderboard' => $leaderboardData,
                'quiz' => [
                    'personalQuizID' => $personalQuiz->personalQuizID,
                    'title' => $personalQuiz->title,
                    'description' => $personalQuiz->description,
                    'subject' => $personalQuiz->subject ? [
                        'subjectID' => $personalQuiz->subject->subjectID,
                        'subjectCode' => $personalQuiz->subject->subjectCode,
                        'subjectName' => $personalQuiz->subject->subjectName,
                    ] : null,
                    'quizType' => $personalQuiz->quizType ? [
                        'id' => $personalQuiz->quizType->id,
                        'name' => $personalQuiz->quizType->name,
                    ] : null,
                ],
                'total' => $leaderboardData->count(),
            ], 200);
        } catch (\Throwable $e) {
            Log::error('Error retrieving personal quiz leaderboard', [
                'user_id' => optional(Auth::user())->userID,
                'personal_quiz_id' => $personalQuizID,
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An error occurred while retrieving the leaderboard.',
                'error' => app()->environment('local') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Get recent takers for a personal quiz.
     * Returns users who took the quiz within the last 7 days.
     * Returns data regardless of which class the quiz is assigned to.
     * Only accessible by faculty (roleID 2,3,4,5).
     * Ordered from most recent to oldest.
     */
    public function recentTakers(Request $request, $personalQuizID)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return response()->json(['success' => false, 'message' => 'Unauthorized'], 401);
            }

            // Check if user is faculty (roleID 2,3,4,5)
            if (!in_array($user->roleID, [2, 3, 4, 5])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Only faculty members can access this feature.',
                ], 403);
            }

            // Validate personal quiz exists
            $personalQuiz = PersonalQuiz::with(['subject', 'quizType', 'creator'])
                ->find($personalQuizID);

            if (!$personalQuiz) {
                return response()->json([
                    'success' => false,
                    'message' => 'Personal quiz not found.',
                ], 404);
            }

            // Verify user has access to this quiz
            $hasAccess = false;
            if ($personalQuiz->created_by === $user->userID) {
                $hasAccess = true;
            } elseif (in_array($user->roleID, [3, 4, 5])) {
                $hasAccess = true;
            }

            if (!$hasAccess) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to access this quiz.',
                ], 403);
            }

            // Calculate date 7 days ago
            $sevenDaysAgo = now()->subDays(7)->startOfDay();

            // Get all class quiz assignments for this personal quiz
            $classQuizAssignments = ClassPersonalQuiz::where('personalQuizID', $personalQuizID)
                ->pluck('classPersonalQuizID')
                ->toArray();

            if (empty($classQuizAssignments)) {
                return response()->json([
                    'success' => true,
                    'message' => 'This quiz is not assigned to any classes yet.',
                    'recentTakers' => [],
                    'quiz' => [
                        'personalQuizID' => $personalQuiz->personalQuizID,
                        'title' => $personalQuiz->title,
                    ],
                    'dateRange' => [
                        'from' => $sevenDaysAgo,
                        'to' => now(),
                        'days' => 7,
                    ],
                ], 200);
            }

            // Build query for results within the last 7 days across all classes
            $query = StudentQuizResult::with(['student' => function($query) {
                $query->with('program');
            }, 'classQuizAssignment'])
                ->whereIn('class_quiz_assignment_id', $classQuizAssignments)
                ->where(function($q) use ($sevenDaysAgo) {
                    $q->where('submitted_at', '>=', $sevenDaysAgo)
                      ->orWhere(function($subQ) use ($sevenDaysAgo) {
                          $subQ->whereNull('submitted_at')
                               ->where('created_at', '>=', $sevenDaysAgo);
                      });
                });

            $results = $query->orderBy('submitted_at', 'desc')
                ->orderBy('created_at', 'desc')
                ->get();

            if ($results->isEmpty()) {
                return response()->json([
                    'success' => true,
                    'message' => 'No recent quiz takers found for this quiz.',
                    'recentTakers' => [],
                    'quiz' => [
                        'personalQuizID' => $personalQuiz->personalQuizID,
                        'title' => $personalQuiz->title,
                    ],
                    'dateRange' => [
                        'from' => $sevenDaysAgo,
                        'to' => now(),
                        'days' => 7,
                    ],
                ], 200);
            }

            // Get all userCodes from results
            $userCodes = $results->pluck('student.userCode')->filter()->unique()->toArray();

            // Get student information (year level) for these users
            $students = Student::whereIn('userCode', $userCodes)
                ->get()
                ->keyBy('userCode');

            // Group by student and get their latest attempt and highest score
            $recentTakers = $results->groupBy('studentID')->map(function($records, $studentID) use ($students) {
                $student = $records->first()->student;
                if (!$student) {
                    return null;
                }

                // Get most recent attempt
                $mostRecent = $records->sortByDesc(function($record) {
                    $date = $record->submitted_at ?? $record->created_at;
                    return $date ? $date->timestamp : 0;
                })->first();

                // Find highest score among all attempts
                $highestResult = $records->sortByDesc(function($record) {
                    return [$record->percentage, $record->score];
                })->first();

                // Get student info for year level
                $studentInfo = $students->get($student->userCode);

                $lastAttemptDate = $mostRecent->submitted_at ?? $mostRecent->created_at;

                return [
                    'userID' => $studentID,
                    'studentID' => $student->userCode,
                    'name' => trim($student->firstName . ' ' . $student->lastName),
                    'firstName' => $student->firstName,
                    'lastName' => $student->lastName,
                    'course' => $student->program ? $student->program->programName : 'N/A',
                    'programID' => $student->programID,
                    'year' => $studentInfo ? $studentInfo->yearLevel : null,
                    'yearLevel' => $studentInfo ? $studentInfo->yearLevel : null,
                    'highestScore' => $highestResult->score,
                    'totalScore' => $highestResult->total_score,
                    'highestPercentage' => round($highestResult->percentage, 2),
                    'attempts' => $records->count(),
                    'lastAttemptDate' => $lastAttemptDate,
                    'lastAttemptScore' => $mostRecent->score,
                    'lastAttemptTotalScore' => $mostRecent->total_score,
                    'lastAttemptPercentage' => round($mostRecent->percentage, 2),
                    'daysAgo' => $lastAttemptDate ? now()->diffInDays($lastAttemptDate) : null,
                ];
            })->filter()->values();

            // Sort by most recent attempt (descending)
            $recentTakers = $recentTakers->sortByDesc(function($item) {
                return $item['lastAttemptDate'] ? $item['lastAttemptDate']->timestamp : 0;
            })->values();

            return response()->json([
                'success' => true,
                'message' => 'Recent takers retrieved successfully.',
                'recentTakers' => $recentTakers,
                'quiz' => [
                    'personalQuizID' => $personalQuiz->personalQuizID,
                    'title' => $personalQuiz->title,
                    'description' => $personalQuiz->description,
                    'subject' => $personalQuiz->subject ? [
                        'subjectID' => $personalQuiz->subject->subjectID,
                        'subjectCode' => $personalQuiz->subject->subjectCode,
                        'subjectName' => $personalQuiz->subject->subjectName,
                    ] : null,
                    'quizType' => $personalQuiz->quizType ? [
                        'id' => $personalQuiz->quizType->id,
                        'name' => $personalQuiz->quizType->name,
                    ] : null,
                ],
                'dateRange' => [
                    'from' => $sevenDaysAgo,
                    'to' => now(),
                    'days' => 7,
                ],
                'total' => $recentTakers->count(),
            ], 200);
        } catch (\Throwable $e) {
            Log::error('Error retrieving recent personal quiz takers', [
                'user_id' => optional(Auth::user())->userID,
                'personal_quiz_id' => $personalQuizID,
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An error occurred while retrieving recent takers.',
                'error' => app()->environment('local') ? $e->getMessage() : null,
            ], 500);
        }
    }
}

