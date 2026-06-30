<?php

namespace Modules\PracticeExams\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Modules\PracticeExams\Models\PracticeExamResult;
use Modules\Users\Models\User;
use Modules\Users\Models\Student;

class PracticeExamLeaderboardController extends Controller
{
    /**
     * Get leaderboard for practice exams by subject.
     * Returns: name, course, year, student id, highest score and percentage, attempts.
     * All roles can see this.
     */
    public function leaderboard(Request $request, $subjectID)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return response()->json(['success' => false, 'message' => 'Unauthorized'], 401);
            }

            // Validate subject exists
            $subjectExists = DB::table('subjects')->where('subjectID', $subjectID)->exists();
            if (!$subjectExists) {
                return response()->json(['success' => false, 'message' => 'Subject not found.'], 404);
            }

            // Get all results for this subject with user and student information
            $results = PracticeExamResult::with(['user.program'])
                ->where('subjectID', $subjectID)
                ->get();

            if ($results->isEmpty()) {
                return response()->json([
                    'success' => true,
                    'message' => 'No practice exam results found for this subject.',
                    'leaderboard' => [],
                    'subject' => [
                        'subjectID' => $subjectID,
                    ],
                ], 200);
            }

            // Get all userCodes from results
            $userCodes = $results->pluck('user.userCode')->filter()->unique()->toArray();

            // Get student information (year level) for these users
            $students = Student::whereIn('userCode', $userCodes)
                ->get()
                ->keyBy('userCode');

            // Group by user and calculate highest score and attempts
            $leaderboardData = $results->groupBy('userID')->map(function($records, $userID) use ($students) {
                $user = $records->first()->user;
                if (!$user) {
                    return null;
                }

                // Find highest score (by percentage, then by earnedPoints)
                $highestResult = $records->sortByDesc(function($record) {
                    return [$record->percentage, $record->earnedPoints];
                })->first();

                // Get student info for year level
                $student = $students->get($user->userCode);

                return [
                    'userID' => $userID,
                    'studentID' => $user->userCode,
                    'name' => trim($user->firstName . ' ' . $user->lastName),
                    'firstName' => $user->firstName,
                    'lastName' => $user->lastName,
                    'course' => $user->program ? $user->program->programName : 'N/A',
                    'programID' => $user->programID,
                    'year' => $student ? $student->yearLevel : null,
                    'yearLevel' => $student ? $student->yearLevel : null,
                    'highestScore' => $highestResult->earnedPoints,
                    'totalPoints' => $highestResult->totalPoints,
                    'highestPercentage' => round($highestResult->percentage, 2),
                    'attempts' => $records->count(),
                    'lastAttemptDate' => $records->max('created_at'),
                ];
            })->filter()->values();

            // Sort by highest percentage (descending), then by highest score, then by attempts
            $leaderboardData = $leaderboardData->sortByDesc(function($item) {
                return [$item['highestPercentage'], $item['highestScore'], $item['attempts']];
            })->values();

            // Get subject information
            $subject = DB::table('subjects')->where('subjectID', $subjectID)->first();

            return response()->json([
                'success' => true,
                'message' => 'Leaderboard retrieved successfully.',
                'leaderboard' => $leaderboardData,
                'subject' => [
                    'subjectID' => $subjectID,
                    'subjectCode' => $subject->subjectCode ?? null,
                    'subjectName' => $subject->subjectName ?? null,
                ],
                'total' => $leaderboardData->count(),
            ], 200);
        } catch (\Throwable $e) {
            Log::error('Error retrieving practice exam leaderboard', [
                'user_id' => optional(Auth::user())->userID,
                'subject_id' => $subjectID,
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An error occurred while retrieving the leaderboard.',
            ], 500);
        }
    }

    /**
     * Get recent takers for practice exams by subject.
     * Returns users who took practice exam within the last 7 days.
     * Faculty: can see all users
     * Students: can only see themselves
     * Ordered from most recent to oldest.
     */
    public function recentTakers(Request $request, $subjectID)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return response()->json(['success' => false, 'message' => 'Unauthorized'], 401);
            }

            // Validate subject exists
            $subjectExists = DB::table('subjects')->where('subjectID', $subjectID)->exists();
            if (!$subjectExists) {
                return response()->json(['success' => false, 'message' => 'Subject not found.'], 404);
            }

            // Calculate date 7 days ago
            $sevenDaysAgo = now()->subDays(7)->startOfDay();

            // Build query for results within the last 7 days
            $query = PracticeExamResult::with(['user.program'])
                ->where('subjectID', $subjectID)
                ->where('created_at', '>=', $sevenDaysAgo);

            // Students can only see their own results
            if ($user->roleID == 1) {
                $query->where('userID', $user->userID);
            }
            // Faculty and admins can see all results

            $results = $query->orderBy('created_at', 'desc')->get();

            if ($results->isEmpty()) {
                return response()->json([
                    'success' => true,
                    'message' => 'No recent practice exam takers found for this subject.',
                    'recentTakers' => [],
                    'subject' => [
                        'subjectID' => $subjectID,
                    ],
                    'dateRange' => [
                        'from' => $sevenDaysAgo,
                        'to' => now(),
                    ],
                ], 200);
            }

            // Get all userCodes from results
            $userCodes = $results->pluck('user.userCode')->filter()->unique()->toArray();

            // Get student information (year level) for these users
            $students = Student::whereIn('userCode', $userCodes)
                ->get()
                ->keyBy('userCode');

            // Group by user and get their latest attempt and highest score
            $recentTakers = $results->groupBy('userID')->map(function($records, $userID) use ($students) {
                $user = $records->first()->user;
                if (!$user) {
                    return null;
                }

                // Get most recent attempt
                $mostRecent = $records->sortByDesc('created_at')->first();

                // Find highest score among all attempts
                $highestResult = $records->sortByDesc(function($record) {
                    return [$record->percentage, $record->earnedPoints];
                })->first();

                // Get student info for year level
                $student = $students->get($user->userCode);

                return [
                    'userID' => $userID,
                    'studentID' => $user->userCode,
                    'name' => trim($user->firstName . ' ' . $user->lastName),
                    'firstName' => $user->firstName,
                    'lastName' => $user->lastName,
                    'course' => $user->program ? $user->program->programName : 'N/A',
                    'programID' => $user->programID,
                    'year' => $student ? $student->yearLevel : null,
                    'yearLevel' => $student ? $student->yearLevel : null,
                    'highestScore' => $highestResult->earnedPoints,
                    'totalPoints' => $highestResult->totalPoints,
                    'highestPercentage' => round($highestResult->percentage, 2),
                    'attempts' => $records->count(),
                    'lastAttemptDate' => $mostRecent->created_at,
                    'lastAttemptScore' => $mostRecent->earnedPoints,
                    'lastAttemptPercentage' => round($mostRecent->percentage, 2),
                    'daysAgo' => now()->diffInDays($mostRecent->created_at),
                ];
            })->filter()->values();

            // Sort by most recent attempt (descending)
            $recentTakers = $recentTakers->sortByDesc(function($item) {
                return $item['lastAttemptDate'];
            })->values();

            // Get subject information
            $subject = DB::table('subjects')->where('subjectID', $subjectID)->first();

            return response()->json([
                'success' => true,
                'message' => 'Recent takers retrieved successfully.',
                'recentTakers' => $recentTakers,
                'subject' => [
                    'subjectID' => $subjectID,
                    'subjectCode' => $subject->subjectCode ?? null,
                    'subjectName' => $subject->subjectName ?? null,
                ],
                'dateRange' => [
                    'from' => $sevenDaysAgo,
                    'to' => now(),
                    'days' => 7,
                ],
                'total' => $recentTakers->count(),
            ], 200);
        } catch (\Throwable $e) {
            Log::error('Error retrieving recent practice exam takers', [
                'user_id' => optional(Auth::user())->userID,
                'subject_id' => $subjectID,
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An error occurred while retrieving recent takers.',
            ], 500);
        }
    }

    /**
     * Get overall leaderboard across all subjects (optional feature).
     * Returns top performers across all subjects.
     */
    public function overallLeaderboard(Request $request)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return response()->json(['success' => false, 'message' => 'Unauthorized'], 401);
            }

            // Get all results with user and student information
            $results = PracticeExamResult::with(['user.program', 'subject'])
                ->get();

            if ($results->isEmpty()) {
                return response()->json([
                    'success' => true,
                    'message' => 'No practice exam results found.',
                    'leaderboard' => [],
                ], 200);
            }

            // Get all userCodes from results
            $userCodes = $results->pluck('user.userCode')->filter()->unique()->toArray();

            // Get student information (year level) for these users
            $students = Student::whereIn('userCode', $userCodes)
                ->get()
                ->keyBy('userCode');

            // Group by user and calculate overall statistics
            $leaderboardData = $results->groupBy('userID')->map(function($records, $userID) use ($students) {
                $user = $records->first()->user;
                if (!$user) {
                    return null;
                }

                // Calculate overall average percentage
                $averagePercentage = $records->avg('percentage');
                $totalAttempts = $records->count();
                $subjectsCount = $records->pluck('subjectID')->unique()->count();

                // Find highest score across all subjects
                $highestResult = $records->sortByDesc(function($record) {
                    return [$record->percentage, $record->earnedPoints];
                })->first();

                // Get student info for year level
                $student = $students->get($user->userCode);

                return [
                    'userID' => $userID,
                    'studentID' => $user->userCode,
                    'name' => trim($user->firstName . ' ' . $user->lastName),
                    'firstName' => $user->firstName,
                    'lastName' => $user->lastName,
                    'course' => $user->program ? $user->program->programName : 'N/A',
                    'programID' => $user->programID,
                    'year' => $student ? $student->yearLevel : null,
                    'yearLevel' => $student ? $student->yearLevel : null,
                    'averagePercentage' => round($averagePercentage, 2),
                    'highestPercentage' => round($highestResult->percentage, 2),
                    'totalAttempts' => $totalAttempts,
                    'subjectsCount' => $subjectsCount,
                    'lastAttemptDate' => $records->max('created_at'),
                ];
            })->filter()->values();

            // Sort by average percentage (descending)
            $leaderboardData = $leaderboardData->sortByDesc(function($item) {
                return [$item['averagePercentage'], $item['highestPercentage'], $item['totalAttempts']];
            })->values();

            return response()->json([
                'success' => true,
                'message' => 'Overall leaderboard retrieved successfully.',
                'leaderboard' => $leaderboardData,
                'total' => $leaderboardData->count(),
            ], 200);
        } catch (\Throwable $e) {
            Log::error('Error retrieving overall practice exam leaderboard', [
                'user_id' => optional(Auth::user())->userID,
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An error occurred while retrieving the overall leaderboard.',
            ], 500);
        }
    }

    /**
     * Get overall recent takers across all subjects.
     * Returns users who took practice exam within the last 7 days across any subject.
     * Faculty: can see all users
     * Students: can only see themselves
     * Ordered from most recent to oldest.
     */
    public function overallRecentTakers(Request $request)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return response()->json(['success' => false, 'message' => 'Unauthorized'], 401);
            }

            // Calculate date 7 days ago
            $sevenDaysAgo = now()->subDays(7)->startOfDay();

            // Build query for results within the last 7 days
            $query = PracticeExamResult::with(['user.program', 'subject'])
                ->where('created_at', '>=', $sevenDaysAgo);

            // Students can only see their own results
            if ($user->roleID == 1) {
                $query->where('userID', $user->userID);
            }
            // Faculty and admins can see all results

            $results = $query->orderBy('created_at', 'desc')->get();

            if ($results->isEmpty()) {
                return response()->json([
                    'success' => true,
                    'message' => 'No recent practice exam takers found.',
                    'recentTakers' => [],
                    'dateRange' => [
                        'from' => $sevenDaysAgo,
                        'to' => now(),
                    ],
                ], 200);
            }

            // Get all userCodes from results
            $userCodes = $results->pluck('user.userCode')->filter()->unique()->toArray();

            // Get student information (year level) for these users
            $students = Student::whereIn('userCode', $userCodes)
                ->get()
                ->keyBy('userCode');

            // Group by user and get their latest attempt and statistics
            $recentTakers = $results->groupBy('userID')->map(function($records, $userID) use ($students) {
                $user = $records->first()->user;
                if (!$user) {
                    return null;
                }

                // Get most recent attempt across all subjects
                $mostRecent = $records->sortByDesc('created_at')->first();

                // Find highest score across all attempts
                $highestResult = $records->sortByDesc(function($record) {
                    return [$record->percentage, $record->earnedPoints];
                })->first();

                // Calculate statistics
                $averagePercentage = $records->avg('percentage');
                $subjectsCount = $records->pluck('subjectID')->unique()->count();
                $subjects = $records->pluck('subject')->filter()->unique('subjectID')->map(function($subject) {
                    return [
                        'subjectID' => $subject->subjectID,
                        'subjectCode' => $subject->subjectCode,
                        'subjectName' => $subject->subjectName,
                    ];
                })->values();

                // Get student info for year level
                $student = $students->get($user->userCode);

                return [
                    'userID' => $userID,
                    'studentID' => $user->userCode,
                    'name' => trim($user->firstName . ' ' . $user->lastName),
                    'firstName' => $user->firstName,
                    'lastName' => $user->lastName,
                    'course' => $user->program ? $user->program->programName : 'N/A',
                    'programID' => $user->programID,
                    'year' => $student ? $student->yearLevel : null,
                    'yearLevel' => $student ? $student->yearLevel : null,
                    'averagePercentage' => round($averagePercentage, 2),
                    'highestScore' => $highestResult->earnedPoints,
                    'totalPoints' => $highestResult->totalPoints,
                    'highestPercentage' => round($highestResult->percentage, 2),
                    'totalAttempts' => $records->count(),
                    'subjectsCount' => $subjectsCount,
                    'subjects' => $subjects,
                    'lastAttemptDate' => $mostRecent->created_at,
                    'lastAttemptSubject' => $mostRecent->subject ? [
                        'subjectID' => $mostRecent->subject->subjectID,
                        'subjectCode' => $mostRecent->subject->subjectCode,
                        'subjectName' => $mostRecent->subject->subjectName,
                    ] : null,
                    'lastAttemptScore' => $mostRecent->earnedPoints,
                    'lastAttemptPercentage' => round($mostRecent->percentage, 2),
                    'daysAgo' => now()->diffInDays($mostRecent->created_at),
                ];
            })->filter()->values();

            // Sort by most recent attempt (descending)
            $recentTakers = $recentTakers->sortByDesc(function($item) {
                return $item['lastAttemptDate'];
            })->values();

            return response()->json([
                'success' => true,
                'message' => 'Overall recent takers retrieved successfully.',
                'recentTakers' => $recentTakers,
                'dateRange' => [
                    'from' => $sevenDaysAgo,
                    'to' => now(),
                    'days' => 7,
                ],
                'total' => $recentTakers->count(),
            ], 200);
        } catch (\Throwable $e) {
            Log::error('Error retrieving overall recent practice exam takers', [
                'user_id' => optional(Auth::user())->userID,
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An error occurred while retrieving overall recent takers.',
            ], 500);
        }
    }
}

