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

            // Use database-level aggregation with GROUP BY and LIMIT
            $limit = (int) $request->query('limit', 50);
            $limitWithBuffer = $limit * 3;

            // Get aggregated stats per user using database
            $aggregated = DB::table('practice_exam_results')
                ->join('users', 'practice_exam_results.userID', '=', 'users.userID')
                ->leftJoin('programs', 'users.programID', '=', 'programs.programID')
                ->leftJoin('students', 'users.userCode', '=', 'students.userCode')
                ->where('practice_exam_results.subjectID', $subjectID)
                ->select([
                    'practice_exam_results.userID',
                    'users.userCode',
                    'users.firstName',
                    'users.lastName',
                    'programs.programName as program',
                    'users.programID',
                    'students.yearLevel',
                ])
                ->selectRaw('MAX(practice_exam_results.percentage) as highestPercentage')
                ->selectRaw('MAX(practice_exam_results.earnedPoints) as highestScore')
                ->selectRaw('MAX(practice_exam_results.totalPoints) as totalPoints')
                ->selectRaw('COUNT(*) as attempts')
                ->groupBy('practice_exam_results.userID', 'users.userCode', 'users.firstName', 'users.lastName', 'programs.programName', 'users.programID', 'students.yearLevel')
                ->orderByDesc('highestScore')
                ->orderByDesc('highestPercentage')
                ->limit($limitWithBuffer)
                ->get();

            if ($aggregated->isEmpty()) {
                return response()->json([
                    'success' => true,
                    'message' => 'No practice exam results found for this subject.',
                    'leaderboard' => [],
                    'subject' => [
                        'subjectID' => $subjectID,
                    ],
                ], 200);
            }

            // For tie-breaking, fetch the earliest best result per user
            $userIds = $aggregated->pluck('userID')->toArray();
            $topPercentages = $aggregated->pluck('highestPercentage')->toArray();
            $bestResults = DB::table('practice_exam_results')
                ->whereIn('userID', $userIds)
                ->whereIn('percentage', $topPercentages)
                ->select('userID', 'subjectID', 'resultID', 'created_at')
                ->get()
                ->groupBy('userID');

            // Build leaderboard data
            $rank = 1;
            $leaderboardData = $aggregated->map(function ($row) use (&$rank, $bestResults) {
                $bestResult = $bestResults->get($row->userID)?->sortBy('created_at')->first();

                return [
                    'userID' => $row->userID,
                    'studentID' => $row->userCode,
                    'name' => trim($row->firstName . ' ' . $row->lastName),
                    'firstName' => $row->firstName,
                    'lastName' => $row->lastName,
                    'course' => $row->program ?? 'N/A',
                    'programID' => $row->programID,
                    'year' => $row->yearLevel,
                    'yearLevel' => $row->yearLevel,
                    'highestScore' => $row->highestScore,
                    'totalPoints' => $row->totalPoints,
                    'highestPercentage' => round($row->highestPercentage, 2),
                    'attempts' => $row->attempts,
                    'lastAttemptDate' => $bestResult ? $bestResult->created_at : null,
                ];
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
                'error' => app()->environment('local') ? $e->getMessage() : null,
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

            // Build optimized query with database-level aggregation
            $limit = (int) $request->query('limit', 50);
            $limitWithBuffer = $limit * 3;

            // Use subquery to get latest attempt per user, then join for stats
            $aggregated = DB::table('practice_exam_results')
                ->join('users', 'practice_exam_results.userID', '=', 'users.userID')
                ->leftJoin('programs', 'users.programID', '=', 'programs.programID')
                ->leftJoin('students', 'users.userCode', '=', 'students.userCode')
                ->where('practice_exam_results.subjectID', $subjectID)
                ->where('practice_exam_results.created_at', '>=', $sevenDaysAgo);

            // Students can only see their own results
            if ($user->roleID == 1) {
                $aggregated->where('practice_exam_results.userID', $user->userID);
            }

            $aggregated = $aggregated
                ->select([
                    'practice_exam_results.userID',
                    'users.userCode',
                    'users.firstName',
                    'users.lastName',
                    'programs.programName as program',
                    'users.programID',
                    'students.yearLevel',
                ])
                ->selectRaw('MAX(practice_exam_results.percentage) as highestPercentage')
                ->selectRaw('MAX(practice_exam_results.earnedPoints) as highestScore')
                ->selectRaw('MAX(practice_exam_results.totalPoints) as totalPoints')
                ->selectRaw('COUNT(*) as attempts')
                ->selectRaw('MAX(practice_exam_results.created_at) as lastAttemptDate')
                ->selectRaw('(SELECT earnedPoints FROM practice_exam_results AS latest WHERE latest.userID = practice_exam_results.userID AND latest.subjectID = practice_exam_results.subjectID ORDER BY created_at DESC LIMIT 1) as lastAttemptScore')
                ->selectRaw('(SELECT percentage FROM practice_exam_results AS latest WHERE latest.userID = practice_exam_results.userID AND latest.subjectID = practice_exam_results.subjectID ORDER BY created_at DESC LIMIT 1) as lastAttemptPercentage')

                ->groupBy('practice_exam_results.userID', 'practice_exam_results.subjectID', 'users.userCode', 'users.firstName', 'users.lastName', 'programs.programName', 'users.programID', 'students.yearLevel')
                ->orderByDesc('lastAttemptDate')
                ->limit($limitWithBuffer)
                ->get();

            if ($aggregated->isEmpty()) {
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

            // Build recent takers data
            $recentTakers = $aggregated->map(function ($row) {
                return [
                    'userID' => $row->userID,
                    'studentID' => $row->userCode,
                    'name' => trim($row->firstName . ' ' . $row->lastName),
                    'firstName' => $row->firstName,
                    'lastName' => $row->lastName,
                    'course' => $row->program ?? 'N/A',
                    'programID' => $row->programID,
                    'year' => $row->yearLevel,
                    'yearLevel' => $row->yearLevel,
                    'highestScore' => $row->highestScore,
                    'totalPoints' => $row->totalPoints,
                    'highestPercentage' => round($row->highestPercentage, 2),
                    'totalAttempts' => $row->attempts,
                    'lastAttemptDate' => $row->lastAttemptDate,
                    'lastAttemptScore' => $row->lastAttemptScore,
                    'lastAttemptPercentage' => $row->lastAttemptPercentage !== null ? round($row->lastAttemptPercentage, 2) : null,
                    'daysAgo' => $row->lastAttemptDate ? now()->diffInDays($row->lastAttemptDate) : null,
                ];
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
                'error' => app()->environment('local') ? $e->getMessage() : null,
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

            // Use database-level aggregation with GROUP BY and LIMIT
            $limit = (int) $request->query('limit', 50);
            $limitWithBuffer = $limit * 3;

            $programID = $request->query('programID');
            $subjectID = $request->query('subjectID');

            $aggregated = DB::table('practice_exam_results')
                ->join('users', 'practice_exam_results.userID', '=', 'users.userID')
                ->leftJoin('programs', 'users.programID', '=', 'programs.programID')
                ->leftJoin('students', 'users.userCode', '=', 'students.userCode')
                ->where('users.roleID', 1)
                ->when($programID, fn ($q) => $q->where('users.programID', $programID))
                ->when($subjectID, fn ($q) => $q->where('practice_exam_results.subjectID', $subjectID))
                ->select([
                    'practice_exam_results.userID',
                    'users.userCode',
                    'users.firstName',
                    'users.lastName',
                    'programs.programName as program',
                    'users.programID',
                    'students.yearLevel',
                ])
                ->selectRaw('AVG(practice_exam_results.percentage) as averagePercentage')
                ->selectRaw('MAX(practice_exam_results.percentage) as highestPercentage')
                ->selectRaw('MAX(practice_exam_results.earnedPoints) as highestScore')
                ->selectRaw('COUNT(*) as totalAttempts')
                ->selectRaw('COUNT(DISTINCT practice_exam_results.subjectID) as subjectsCount')
                ->groupBy('practice_exam_results.userID', 'users.userCode', 'users.firstName', 'users.lastName', 'programs.programName', 'users.programID', 'students.yearLevel')
                ->orderByDesc('averagePercentage')
                ->orderByDesc('highestPercentage')
                ->orderByDesc('totalAttempts')
                ->limit($limitWithBuffer)
                ->get();

            if ($aggregated->isEmpty()) {
                return response()->json([
                    'success' => true,
                    'message' => 'No practice exam results found.',
                    'leaderboard' => [],
                ], 200);
            }

            // For tie-breaking, fetch the most recent attempt per user
            $userIds = $aggregated->pluck('userID')->toArray();
            $lastAttempts = DB::table('practice_exam_results')
                ->whereIn('userID', $userIds)
                ->select('userID', 'created_at')
                ->get()
                ->groupBy('userID');

            // Build leaderboard data
            $leaderboardData = $aggregated->map(function ($row) use ($lastAttempts) {
                $userLastAttempts = $lastAttempts->get($row->userID);
                $lastAttempt = $userLastAttempts ? $userLastAttempts->sortByDesc('created_at')->first() : null;

                return [
                    'userID' => $row->userID,
                    'studentID' => $row->userCode,
                    'name' => trim($row->firstName . ' ' . $row->lastName),
                    'firstName' => $row->firstName,
                    'lastName' => $row->lastName,
                    'course' => $row->program ?? 'N/A',
                    'program' => $row->program ?? 'N/A',
                    'programID' => $row->programID,
                    'year' => $row->yearLevel,
                    'yearLevel' => $row->yearLevel,
                    'averagePercentage' => round($row->averagePercentage, 2),
                    'highestPercentage' => round($row->highestPercentage, 2),
                    'totalAttempts' => $row->totalAttempts,
                    'subjectsCount' => $row->subjectsCount,
                    'lastAttemptDate' => $lastAttempt ? $lastAttempt->created_at : null,
                ];
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
                'error' => app()->environment('local') ? $e->getMessage() : null,
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

            // Optional filter parameters
            $programID = $request->query('programID');
            $subjectID = $request->query('subjectID');
            $facultyID = $request->query('facultyID');

            // Use database-level aggregation with GROUP BY and LIMIT
            $limit = (int) $request->query('limit', 50);
            $limitWithBuffer = $limit * 3;

            $aggregated = DB::table('practice_exam_results')
                ->join('users', 'practice_exam_results.userID', '=', 'users.userID')
                ->leftJoin('programs', 'users.programID', '=', 'programs.programID')
                ->leftJoin('students', 'users.userCode', '=', 'students.userCode')
                ->where('practice_exam_results.created_at', '>=', $sevenDaysAgo);

            // Students can only see their own results
            if ($user->roleID == 1) {
                $aggregated->where('practice_exam_results.userID', $user->userID);
            }

            // Apply optional filters
            if ($programID) {
                $aggregated->where('users.programID', $programID);
            }
            if ($subjectID) {
                $aggregated->where('practice_exam_results.subjectID', $subjectID);
            }
            if ($facultyID) {
                $teacherStudentIds = DB::table('student_teacher_enrollments')
                    ->where('teacherID', $facultyID)
                    ->pluck('studentID');
                $aggregated->whereIn('practice_exam_results.userID', $teacherStudentIds);
            }

            $aggregated = $aggregated
                ->select([
                    'practice_exam_results.userID',
                    'users.userCode',
                    'users.firstName',
                    'users.lastName',
                    'programs.programName as program',
                    'users.programID',
                    'students.yearLevel',
                ])
                ->selectRaw('AVG(practice_exam_results.percentage) as averagePercentage')
                ->selectRaw('MAX(practice_exam_results.percentage) as highestPercentage')
                ->selectRaw('MAX(practice_exam_results.earnedPoints) as highestScore')
                ->selectRaw('MAX(practice_exam_results.totalPoints) as totalPoints')
                ->selectRaw('COUNT(*) as totalAttempts')
                ->selectRaw('COUNT(DISTINCT practice_exam_results.subjectID) as subjectsCount')
                ->selectRaw('MAX(practice_exam_results.created_at) as lastAttemptDate')
                ->groupBy('practice_exam_results.userID', 'users.userCode', 'users.firstName', 'users.lastName', 'programs.programName', 'users.programID', 'students.yearLevel')
                ->orderByDesc('lastAttemptDate')
                ->limit($limitWithBuffer)
                ->get();

            if ($aggregated->isEmpty()) {
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

            // Get subject info for the last attempt
            $userIds = $aggregated->pluck('userID')->toArray();
            $lastAttemptSubject = DB::table('practice_exam_results')
                ->join('subjects', 'practice_exam_results.subjectID', '=', 'subjects.subjectID')
                ->whereIn('practice_exam_results.userID', $userIds)
                ->where('practice_exam_results.created_at', '>=', $sevenDaysAgo)
                ->select('practice_exam_results.userID', 'subjects.subjectID', 'subjects.subjectCode', 'subjects.subjectName', 'practice_exam_results.earnedPoints', 'practice_exam_results.percentage', 'practice_exam_results.created_at')
                ->get()
                ->groupBy('practice_exam_results.userID');

            // Build recent takers data
            $recentTakers = $aggregated->map(function ($row) use ($lastAttemptSubject) {
                $userLastSubject = $lastAttemptSubject->get($row->userID);
                $lastSubject = $userLastSubject ? $userLastSubject->sortByDesc('created_at')->first() : null;

                return [
                    'userID' => $row->userID,
                    'studentID' => $row->userCode,
                    'name' => trim($row->firstName . ' ' . $row->lastName),
                    'firstName' => $row->firstName,
                    'lastName' => $row->lastName,
                    'course' => $row->program ?? 'N/A',
                    'programID' => $row->programID,
                    'year' => $row->yearLevel,
                    'yearLevel' => $row->yearLevel,
                    'averagePercentage' => round($row->averagePercentage, 2),
                    'highestScore' => $row->highestScore,
                    'totalPoints' => $row->totalPoints,
                    'highestPercentage' => round($row->highestPercentage, 2),
                    'totalAttempts' => $row->totalAttempts,
                    'subjectsCount' => $row->subjectsCount,
                    'lastAttemptDate' => $row->lastAttemptDate,
                    'lastAttemptSubject' => $lastSubject ? [
                        'subjectID' => $lastSubject->subjectID,
                        'subjectCode' => $lastSubject->subjectCode,
                        'subjectName' => $lastSubject->subjectName,
                    ] : null,
                    'lastAttemptScore' => $lastSubject ? $lastSubject->earnedPoints : null,
                    'lastAttemptPercentage' => $lastSubject ? round($lastSubject->percentage, 2) : null,
                    'daysAgo' => $row->lastAttemptDate ? now()->diffInDays($row->lastAttemptDate) : null,
                ];
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
                'error' => app()->environment('local') ? $e->getMessage() : null,
            ], 500);
        }
    }
}

