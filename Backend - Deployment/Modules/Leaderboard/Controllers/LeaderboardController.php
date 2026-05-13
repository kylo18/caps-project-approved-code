<?php


namespace Modules\Leaderboard\Controllers;

use Carbon\Carbon;
use Illuminate\Routing\Controller;
use Illuminate\Http\Request;
use App\Services\LeaderboardService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Laravel\Sanctum\PersonalAccessToken;

class LeaderboardController extends Controller
{
    protected $leaderboard;

    public function __construct(LeaderboardService $leaderboard)
    {
        $this->leaderboard = $leaderboard;
    }

    /**
     * GET /api/leaderboard
     * Returns top N students for a given scope.
     * Supports both 'scope' param (for web) and 'program'/'subject' params (for mobile).
     */
    public function index(Request $request)
    {
        // Check if mobile-style filters are being used
        $programFilter = $request->query('program');
        $subjectFilter = $request->query('subject');
        $scope = $request->query('scope', 'global');
        
        // If program or subject filter is provided (and not empty), use mobile-style filtering
        if (!empty($programFilter) || !empty($subjectFilter)) {
            return $this->getMobileLeaderboard($request, $programFilter, $subjectFilter);
        }
        
        // For 'global' scope without filters, use mobile leaderboard format (for mobile app)
        // For other scopes ('exam', 'class', 'program'), use original Redis-based logic
        if ($scope === 'global') {
            return $this->getMobileLeaderboard($request, null, null);
        }
        
        // Otherwise, use original scope-based logic for exam/class/program scopes
        if ($scope === 'program') {
            $id = $request->query('program_id');
        } else {
            $id = $request->query($scope === 'exam' ? 'exam_id' : 'class_id');
        }
        $limit = (int) $request->query('limit', 10);

        $key = $this->leaderboard->buildKey($scope, $id);
        
        try {
            $topRedis = $this->leaderboard->top($key, $limit);
        } catch (\Exception $e) {
            // Redis not available - fallback to database
            \Illuminate\Support\Facades\Log::warning("Redis unavailable for leaderboard: " . $e->getMessage());
            return $this->fallbackToDB($scope, $id, $limit);
        }

        if (!empty($topRedis)) {
            $studentIds = array_keys($topRedis);
            $users = DB::table('users')
                ->leftJoin('programs', 'users.programID', '=', 'programs.programID')
                ->leftJoin('students', 'users.userCode', '=', 'students.userCode')
                ->whereIn('users.userID', $studentIds)
                ->select(
                    'users.userID', 
                    'users.firstName', 
                    'users.lastName', 
                    'users.userCode', 
                    'programs.programName as program',
                    'programs.programName as course',
                    'students.yearLevel as year',
                    'students.yearLevel as yearLevel'
                )
                ->get()
                ->keyBy('userID');

            $examCounts = DB::table('exam_analytics')
                ->whereIn('user_id', $studentIds)
                ->select('user_id', DB::raw('COUNT(DISTINCT attempt_id) as totalExams'))
                ->groupBy('user_id')
                ->pluck('totalExams', 'user_id');

            $data = [];
            $rank = 1;
            foreach ($topRedis as $studentId => $composite) {
                $user = $users[$studentId] ?? null;
                $data[] = [
                    'rank' => $rank++,
                    'student_id' => $studentId,
                    'userID' => (int) $studentId,
                    'firstName' => $user->firstName ?? null,
                    'lastName' => $user->lastName ?? null,
                    'name' => $user ? trim(($user->firstName ?? '') . ' ' . ($user->lastName ?? '')) : 'Unknown Student',
                    'userCode' => $user->userCode ?? null,
                    'program' => $user->program ?? null,
                    'course' => $user->course ?? null,
                    'year' => $user->year ?? null,
                    'yearLevel' => $user->yearLevel ?? null,
                    'score' => (int) floor($composite / 10000000000.0),
                    'totalExams' => (int) ($examCounts[$studentId] ?? 0),
                    'attempts' => (int) ($examCounts[$studentId] ?? 0),
                ];
            }

            return response()->json([
                'data' => $data,
                'leaderboard' => $data,
                'meta' => [
                    'scope' => $scope,
                    'id' => $id,
                    'total' => $this->leaderboard->totalCount($key),
                    'generated_from' => 'redis'
                ]
            ]);
        }

        // Fallback to DB if Redis returns empty
        return $this->fallbackToDB($scope, $id, $limit);
    }
    
    /**
     * Get leaderboard for mobile app with program/subject filtering.
     * Returns programs and subjects lists along with leaderboard data.
     */
    protected function getMobileLeaderboard(Request $request, $programFilter, $subjectFilter)
    {
        try {
            $period = $this->normalizePeriod($request->query('period', 'all_time'));
            [$periodStart, $periodEnd] = $this->getPeriodBounds($period);
            $limit = (int) $request->query('limit', 20); // Default to 20 for mobile
            $viewer = $this->resolveViewer($request);
            $viewerId = $viewer ? (int) $viewer->userID : null;

            // Get programs and subjects - limit subjects to prevent memory issues with 1M+ records
            $programs = DB::table('programs')
                ->select('programID', 'programName')
                ->orderBy('programName')
                ->get();

            // Only fetch subjects that have practice exam results (and limit to 1000 for dropdown)
            $subjects = DB::table('practice_exam_results')
                ->distinct()
                ->select('practice_exam_results.subjectID', 'subjects.subjectName', 'subjects.subjectCode')
                ->join('subjects', 'practice_exam_results.subjectID', '=', 'subjects.subjectID')
                ->orderBy('subjects.subjectName')
                ->limit(1000)
                ->get();

            // Build base query - only select needed columns to reduce memory
            $resultsQuery = DB::table('practice_exam_results as per')
                ->join('users as u', 'per.userID', '=', 'u.userID')
                ->where('u.roleID', 1)
                ->select([
                    'per.userID',
                    DB::raw('MAX(per.percentage) as highestPercentage'),
                    DB::raw('MAX(per.earnedPoints) as highestScore'),
                    DB::raw('COUNT(*) as attempts'),
                ]);

            if ($programFilter) {
                $resultsQuery->where('u.programID', $programFilter);
            }

            if ($subjectFilter) {
                $resultsQuery->where('per.subjectID', $subjectFilter);
            }

            if ($periodStart && $periodEnd) {
                $resultsQuery->whereBetween('per.created_at', [$periodStart, $periodEnd]);
            }

            // Aggregate by user first (this is the expensive part)
            $resultsQuery->groupBy('per.userID');

            // Order and limit AFTER aggregation — rank by POINTS (earnedPoints), not percentage
            $results = $resultsQuery
                ->orderByDesc('highestScore')
                ->orderByDesc('highestPercentage')
                ->limit($limit)
                ->get();

            // If no results, return early
            if ($results->isEmpty()) {
                return response()->json([
                    'data' => [],
                    'leaderboard' => [],
                    'programs' => $programs->map(fn($p) => ['programID' => $p->programID, 'programName' => $p->programName]),
                    'subjects' => $subjects->map(fn($s) => ['subjectID' => $s->subjectID, 'subjectName' => $s->subjectName, 'subjectCode' => $s->subjectCode]),
                    'viewer' => null,
                    'meta' => [
                        'total' => 0,
                        'period' => $period,
                        'periodStartsAt' => $periodStart ? $periodStart->toIso8601String() : null,
                        'periodEndsAt' => $periodEnd ? $periodEnd->toIso8601String() : null,
                        'programFilter' => $programFilter,
                        'subjectFilter' => $subjectFilter,
                        'generated_from' => 'database'
                    ]
                ]);
            }

            // Get user IDs from top results
            $userIds = $results->pluck('userID')->toArray();

            // Single query to get all user details for top users
            $users = DB::table('users as u')
                ->leftJoin('programs as p', 'u.programID', '=', 'p.programID')
                ->leftJoin('students as s', 'u.userCode', '=', 's.userCode')
                ->whereIn('u.userID', $userIds)
                ->select(
                    'u.userID',
                    'u.firstName',
                    'u.lastName',
                    'u.userCode',
                    'p.programName as program',
                    'p.programID',
                    's.yearLevel as year',
                    's.yearLevel as yearLevel'
                )
                ->get()
                ->keyBy('userID');

            // Get best result info for tie-breaking in one query (only for top users)
            $bestResultsRaw = DB::table('practice_exam_results')
                ->whereIn('userID', $userIds)
                ->select('userID', 'subjectID', 'percentage', 'earnedPoints', 'resultID', 'created_at')
                ->get()
                ->groupBy('userID');

            $bestResults = [];
            foreach ($bestResultsRaw as $userId => $userResults) {
                $best = $userResults->sortBy('created_at')->first();
                if ($best) {
                    $bestResults[$userId] = $best;
                }
            }

            // Build ranked users array
            $rankedUsers = [];
            $rank = 1;
            $viewerInTop = false;

            foreach ($results as $result) {
                $userId = $result->userID;
                $user = $users[$userId] ?? null;

                if (!$user) {
                    continue;
                }

                // Track if viewer is in top results
                if ($userId === $viewerId) {
                    $viewerInTop = true;
                }

                $bestResult = $bestResults[$userId] ?? null;
                $subjectId = $subjectFilter ?: ($bestResult ? $bestResult->subjectID : null);

                $rankedUsers[] = [
                    'rank' => $rank++,
                    'userID' => $userId,
                    'student_id' => $userId,
                    'firstName' => $user->firstName,
                    'lastName' => $user->lastName,
                    'name' => trim(($user->firstName ?? '') . ' ' . ($user->lastName ?? '')),
                    'userCode' => $user->userCode,
                    'program' => $user->program,
                    'programID' => $user->programID,
                    'course' => $user->program,
                    'year' => $user->year,
                    'yearLevel' => $user->yearLevel,
                    'subjectID' => $subjectId,
                    'score' => (int) $result->highestScore,
                    'highestScore' => (int) $result->highestScore,
                    'highestPercentage' => round($result->highestPercentage, 2),
                    'attempts' => (int) $result->attempts,
                    'points' => (int) $result->highestScore,
                    'resultID' => $bestResult ? $bestResult->resultID : null,
                    'createdAt' => $bestResult ? $bestResult->created_at : null,
                ];
            }

            // Build viewer summary (simplified - only calculate if needed)
            $viewerSummary = null;
            if ($viewer && (int) ($viewer->roleID ?? 0) === 1) {
                $totalCandidates = count($rankedUsers);

                if ($viewerInTop) {
                    // Viewer is in top 10 - their data is already in rankedUsers
                    $viewerEntry = collect($rankedUsers)->firstWhere('userID', $viewerId);
                    if ($viewerEntry) {
                        $viewerSummary = [
                            'userID' => $viewerId,
                            'rank' => $viewerEntry['rank'],
                            'name' => $viewerEntry['name'],
                            'score' => $viewerEntry['score'],
                            'highestPercentage' => $viewerEntry['highestPercentage'],
                            'attempts' => $viewerEntry['attempts'],
                            'program' => $viewerEntry['program'],
                            'subject' => null,
                            'totalCandidates' => $totalCandidates,
                            'betterThanPercentage' => $totalCandidates > 0 ? round((($totalCandidates - $viewerEntry['rank']) / $totalCandidates) * 100) : 0,
                            'percentile' => $totalCandidates > 0 ? round((($totalCandidates - $viewerEntry['rank']) / $totalCandidates) * 100) : 0,
                            'period' => $period,
                            'periodEndsAt' => $periodEnd ? $periodEnd->toIso8601String() : null,
                        ];
                    }
                } else {
                    // Quick check if viewer has any results at all (lightweight query)
                    $viewerExists = DB::table('practice_exam_results')
                        ->where('userID', $viewerId)
                        ->exists();

                    if ($viewerExists) {
                        // Get viewer's own aggregated stats with program info
                        $viewerProgram = DB::table('users as u')
                            ->leftJoin('programs as p', 'u.programID', '=', 'p.programID')
                            ->where('u.userID', $viewerId)
                            ->value('p.programName');

                        $viewerStats = DB::table('practice_exam_results as per')
                            ->where('per.userID', $viewerId)
                            ->select([
                                DB::raw('MAX(per.percentage) as highestPercentage'),
                                DB::raw('MAX(per.earnedPoints) as highestScore'),
                                DB::raw('COUNT(*) as attempts'),
                            ])
                            ->first();

                        if ($viewerStats && $viewerStats->highestPercentage !== null) {
                            // Count total unique students who have taken practice exams
                            $totalCount = DB::table('practice_exam_results')
                                ->distinct('userID')
                                ->count('userID');

                            // Count users with better points (rank by points first)
                            $betterCount = DB::table('practice_exam_results as per')
                                ->join('users as u', 'per.userID', '=', 'u.userID')
                                ->where('u.roleID', 1)
                                ->groupBy('per.userID')
                                ->selectRaw('per.userID')
                                ->havingRaw('MAX(per.earnedPoints) > ?', [$viewerStats->highestScore])
                                ->get()
                                ->count();

                            // Count users with same points but higher percentage (for tie-breaking)
                            $sameScoreHigherPoints = DB::table('practice_exam_results as per')
                                ->join('users as u', 'per.userID', '=', 'u.userID')
                                ->where('u.roleID', 1)
                                ->groupBy('per.userID')
                                ->selectRaw('per.userID')
                                ->havingRaw('MAX(per.earnedPoints) = ? AND MAX(per.percentage) > ?', [$viewerStats->highestScore, $viewerStats->highestPercentage])
                                ->get()
                                ->count();

                            $userRank = $betterCount + $sameScoreHigherPoints + 1;
                            // Calculate percentile (never negative - 0 means you're at the bottom)
                            $calculatedPercentile = $totalCount > 0 ? round((($totalCount - $userRank) / $totalCount) * 100) : 0;
                            $betterThanPercentage = max(0, $calculatedPercentile); // Never show negative

                            $viewerSummary = [
                                'userID' => $viewerId,
                                'rank' => $userRank,
                                'name' => trim(($viewer->firstName ?? '') . ' ' . ($viewer->lastName ?? '')),
                                'score' => (int) $viewerStats->highestScore,
                                'highestPercentage' => round($viewerStats->highestPercentage, 2),
                                'attempts' => (int) $viewerStats->attempts,
                                'program' => $viewerProgram ?? null,
                                'subject' => null,
                                'totalCandidates' => $totalCount,
                                'betterThanPercentage' => $betterThanPercentage,
                                'percentile' => $betterThanPercentage,
                                'period' => $period,
                                'periodEndsAt' => $periodEnd ? $periodEnd->toIso8601String() : null,
                            ];
                        }
                    } else {
                        // Viewer has no results at all
                        $totalCount = DB::table('practice_exam_results')->distinct('userID')->count('userID');
                        $viewerSummary = [
                            'userID' => $viewerId,
                            'totalCandidates' => $totalCount,
                            'betterThanPercentage' => 0,
                            'percentile' => 0,
                            'period' => $period,
                            'periodEndsAt' => $periodEnd ? $periodEnd->toIso8601String() : null,
                            'program' => $viewer->program ?? null,
                        ];
                    }
                }
            }

            return response()->json([
                'data' => $rankedUsers,
                'leaderboard' => $rankedUsers,
                'programs' => $programs->map(fn($p) => ['programID' => $p->programID, 'programName' => $p->programName]),
                'subjects' => $subjects->map(fn($s) => ['subjectID' => $s->subjectID, 'subjectName' => $s->subjectName, 'subjectCode' => $s->subjectCode]),
                'viewer' => $viewerSummary,
                'meta' => [
                    'total' => count($rankedUsers),
                    'period' => $period,
                    'periodStartsAt' => $periodStart ? $periodStart->toIso8601String() : null,
                    'periodEndsAt' => $periodEnd ? $periodEnd->toIso8601String() : null,
                    'programFilter' => $programFilter,
                    'subjectFilter' => $subjectFilter,
                    'generated_from' => 'database'
                ]
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Leaderboard mobile fetch error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'error' => 'Server error: ' . $e->getMessage(),
                'data' => [],
                'leaderboard' => [],
                'programs' => [],
                'subjects' => [],
                'viewer' => null,
                'meta' => [
                    'total' => 0,
                    'period' => $period,
                    'periodStartsAt' => null,
                    'periodEndsAt' => null,
                    'programFilter' => $programFilter,
                    'subjectFilter' => $subjectFilter,
                ]
            ], 500);
        }
    }

    protected function normalizePeriod(?string $period): string
    {
        return $period === 'weekly' ? 'weekly' : 'all_time';
    }

    protected function getPeriodBounds(string $period): array
    {
        if ($period !== 'weekly') {
            return [null, null];
        }

        $now = Carbon::now('Asia/Manila');
        $start = $now->copy()->startOfWeek(Carbon::SUNDAY);
        $end = $now->copy()->endOfWeek(Carbon::SATURDAY);

        return [
            $start->copy()->setTimezone('UTC'),
            $end->copy()->setTimezone('UTC'),
        ];
    }

    protected function resolveViewer(Request $request): ?object
    {
        $authUser = Auth::user();
        if ($authUser) {
            return $authUser;
        }

        $token = $request->bearerToken();
        if (!$token) {
            return null;
        }

        try {
            // Find token by plain text (tokens are stored in plain text in this setup)
            $accessToken = PersonalAccessToken::where('token', $token)->first();
            return $accessToken?->tokenable;
        } catch (\Throwable $e) {
            return null;
        }
    }

    protected function buildViewerSummary(?object $viewer, array $rankedUsers, string $period, ?Carbon $periodEnd, ?object $resultsQuery): ?array
    {
        if (!$viewer || (int) ($viewer->roleID ?? 0) !== 1) {
            return null;
        }

        $totalCandidates = count($rankedUsers);
        $viewerEntry = collect($rankedUsers)->firstWhere('userID', (int) $viewer->userID);

        // If user is in top 10, use their entry data
        if ($viewerEntry) {
            $rank = (int) $viewerEntry['rank'];
            $betterThanPercentage = $totalCandidates > 0
                ? round((($totalCandidates - $rank) / $totalCandidates) * 100)
                : 0;

            return [
                'userID' => (int) $viewer->userID,
                'rank' => $rank,
                'name' => $viewerEntry['name'],
                'score' => $viewerEntry['score'],
                'highestPercentage' => $viewerEntry['highestPercentage'],
                'attempts' => $viewerEntry['attempts'],
                'program' => $viewerEntry['program'],
                'subject' => $viewerEntry['subject'],
                'totalCandidates' => $totalCandidates,
                'betterThanPercentage' => $betterThanPercentage,
                'percentile' => $betterThanPercentage,
                'period' => $period,
                'periodEndsAt' => $periodEnd ? $periodEnd->toIso8601String() : null,
            ];
        }

        // User is NOT in top 10 - query their aggregated stats
        $userRank = null;
        $userScore = null;
        $userPercentage = null;
        $userAttempts = null;

        if ($resultsQuery) {
            try {
                // Get user's aggregated stats
                $userStats = (clone $resultsQuery)
                    ->where('practice_exam_results.userID', $viewer->userID)
                    ->select([
                        DB::raw('MAX(practice_exam_results.percentage) as highestPercentage'),
                        DB::raw('MAX(practice_exam_results.earnedPoints) as highestScore'),
                        DB::raw('COUNT(*) as attempts'),
                    ])
                    ->first();

                if ($userStats && $userStats->highestPercentage !== null) {
                    $userScore = (int) $userStats->highestScore;
                    $userPercentage = round($userStats->highestPercentage, 2);
                    $userAttempts = (int) $userStats->attempts;

                    // Count all unique users who have taken exams (for percentile calculation)
                    $allUserCount = DB::table('practice_exam_results')
                        ->select(DB::raw('COUNT(DISTINCT userID) as count'))
                        ->first();

                    $totalCandidates = $allUserCount ? (int)$allUserCount->count : 0;

                    // Get count of users ranked above this user (rank by points first)
                    $usersAbove = DB::table('practice_exam_results')
                        ->join('users', 'practice_exam_results.userID', '=', 'users.userID')
                        ->select('practice_exam_results.userID')
                        ->where('users.roleID', 1)
                        ->groupBy('practice_exam_results.userID')
                        ->havingRaw('MAX(earnedPoints) > ?', [$userStats->highestScore])
                        ->get()
                        ->count();

                    $usersSameScore = DB::table('practice_exam_results')
                        ->join('users', 'practice_exam_results.userID', '=', 'users.userID')
                        ->select('practice_exam_results.userID')
                        ->where('users.roleID', 1)
                        ->groupBy('practice_exam_results.userID')
                        ->havingRaw('MAX(earnedPoints) = ? AND MAX(percentage) > ?', [$userStats->highestScore, $userStats->highestPercentage])
                        ->get()
                        ->count();

                    $userRank = $usersAbove + $usersSameScore + 1;
                }
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::warning('Error getting user rank: ' . $e->getMessage());
            }
        }

        if (!$userRank) {
            return [
                'userID' => (int) $viewer->userID,
                'rank' => null,
                'totalCandidates' => $totalCandidates,
                'betterThanPercentage' => 0,
                'percentile' => 0,
                'period' => $period,
                'periodEndsAt' => $periodEnd ? $periodEnd->toIso8601String() : null,
            ];
        }

        $betterThanPercentage = $totalCandidates > 0
            ? round((($totalCandidates - $userRank) / $totalCandidates) * 100)
            : 0;

        return [
            'userID' => (int) $viewer->userID,
            'rank' => $userRank,
            'name' => trim(($viewer->firstName ?? '') . ' ' . ($viewer->lastName ?? '')),
            'score' => $userScore,
            'highestPercentage' => $userPercentage,
            'attempts' => $userAttempts,
            'program' => $viewer->program ?? null,
            'subject' => null,
            'totalCandidates' => $totalCandidates,
            'betterThanPercentage' => $betterThanPercentage,
            'percentile' => $betterThanPercentage,
            'period' => $period,
            'periodEndsAt' => $periodEnd ? $periodEnd->toIso8601String() : null,
        ];
    }

    /**
     * GET /api/leaderboard/me
     * Returns current user rank and score.
     */
    public function me(Request $request)
    {
        $user = Auth::user();
        if ($user->roleID !== 1) { // Assuming 1 is student
            return response()->json(['message' => 'This endpoint is available to students only.'], 403);
        }

        $scope = $request->query('scope', 'global');
        $id = $request->query($scope === 'exam' ? 'exam_id' : 'class_id');
        $key = $this->leaderboard->buildKey($scope, $id);

        try {
            $rank = $this->leaderboard->rankOf($key, $user->userID);
            $score = $this->leaderboard->scoreOf($key, $user->userID);
            $total = $this->leaderboard->totalCount($key);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::warning("Redis unavailable for student leaderboard status: " . $e->getMessage());
            
            return response()->json([
                'rank' => null,
                'score' => null,
                'total_candidates' => 0,
                'message' => 'Ranking system is temporarily offline.',
                'generated_from' => 'error'
            ]);
        }

        if ($rank !== null) {
            return response()->json([
                'rank' => $rank,
                'score' => $score,
                'total_candidates' => $total,
                'scope' => $scope,
                'generated_from' => 'redis'
            ]);
        }

        return response()->json([
            'rank' => null,
            'score' => null,
            'total_candidates' => $total,
            'message' => 'No score recorded yet for this scope.',
            'generated_from' => 'redis'
        ]);
    }

    protected function fallbackToDB($scope, $id, $limit)
    {
        $query = DB::table('exam_analytics')
            ->join('users', 'exam_analytics.user_id', '=', 'users.userID')
            ->leftJoin('programs', 'users.programID', '=', 'programs.programID')
            ->leftJoin('students', 'users.userCode', '=', 'students.userCode')
            ->select(
                'users.userID as student_id',
                'users.firstName',
                'users.lastName',
                'users.userCode',
                'programs.programName as program',
                'programs.programName as course',
                'students.yearLevel as year',
                'students.yearLevel as yearLevel'
            )
            ->selectRaw('MAX(exam_analytics.overall_score) as score, COUNT(DISTINCT exam_analytics.attempt_id) as totalExams')
            ->where('users.roleID', 1)
            ->groupBy('users.userID', 'users.firstName', 'users.lastName', 'users.userCode', 'programs.programName')
            ->orderByDesc('score')
            ->limit($limit);

        if ($scope === 'exam') {
            $query->join('exam_attempts', 'exam_analytics.attempt_id', '=', 'exam_attempts.id')
                  ->where('exam_attempts.exam_id', $id);
        } elseif ($scope === 'class') {
            $query->join('class_enrollments', 'exam_analytics.user_id', '=', 'class_enrollments.studentID')
                  ->where('class_enrollments.classID', $id);
        } elseif ($scope === 'program') {
            $query->where('users.programID', $id);
        }

        $results = $query->get();
        $rank = 1;

        $data = $results->map(function($row) use (&$rank) {
            return [
                'rank' => $rank++,
                'student_id' => $row->student_id,
                'userID' => $row->student_id,
                'firstName' => $row->firstName,
                'lastName' => $row->lastName,
                'name' => trim(($row->firstName ?? '') . ' ' . ($row->lastName ?? '')),
                'userCode' => $row->userCode,
                'program' => $row->program,
                'score' => (int) $row->score,
                'totalExams' => (int) $row->totalExams,
                'attempts' => (int) $row->totalExams,
            ];
        });

        return response()->json([
            'data' => $data,
            'leaderboard' => $data,
            'meta' => [
                'scope' => $scope,
                'id' => $id,
                'total' => $data->count(),
                'generated_from' => 'database'
            ]
        ]);
    }
}
