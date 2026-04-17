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
        // For other scopes ('exam', 'class'), use original Redis-based logic
        if ($scope === 'global') {
            return $this->getMobileLeaderboard($request, null, null);
        }
        
        // Otherwise, use original scope-based logic for exam/class scopes
        $id = $request->query($scope === 'exam' ? 'exam_id' : 'class_id');
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
                ];
            }

            return response()->json([
                'data' => $data,
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
            $limit = (int) $request->query('limit', 50);
            $viewer = $this->resolveViewer($request);
            
            // Get all programs and subjects for dropdown filters
            $programs = DB::table('programs')
                ->select('programID', 'programName')
                ->orderBy('programName')
                ->get();
                
            $subjects = DB::table('subjects')
                ->select('subjectID', 'subjectName', 'subjectCode')
                ->orderBy('subjectName')
                ->get();
            
            // Build query for practice exam results with filters
            $resultsQuery = DB::table('practice_exam_results')
                ->join('users', 'practice_exam_results.userID', '=', 'users.userID')
                ->where('users.roleID', 1); // Only students
                
            // Apply program filter
            if ($programFilter) {
                $resultsQuery->where('users.programID', $programFilter);
            }
            
            // Apply subject filter
            if ($subjectFilter) {
                $resultsQuery->where('practice_exam_results.subjectID', $subjectFilter);
            }

            if ($periodStart && $periodEnd) {
                $resultsQuery->whereBetween('practice_exam_results.created_at', [$periodStart, $periodEnd]);
            }
            
            // Get all matching results
            $results = $resultsQuery
                ->select(
                    'practice_exam_results.resultID',
                    'practice_exam_results.userID',
                    'practice_exam_results.subjectID',
                    'practice_exam_results.percentage',
                    'practice_exam_results.earnedPoints',
                    'practice_exam_results.created_at'
                )
                ->get();
            
            // Get user details for all users in results
            $userIds = $results->pluck('userID')->unique()->toArray();
            
            $users = DB::table('users')
                ->leftJoin('programs', 'users.programID', '=', 'programs.programID')
                ->leftJoin('students', 'users.userCode', '=', 'students.userCode')
                ->whereIn('users.userID', $userIds)
                ->select(
                    'users.userID',
                    'users.firstName',
                    'users.lastName',
                    'users.userCode',
                    'programs.programName as program',
                    'programs.programID',
                    'students.yearLevel as year',
                    'students.yearLevel as yearLevel'
                )
                ->get()
                ->keyBy('userID');
            
            // Get subject details if needed
            $subjectIds = $results->pluck('subjectID')->unique()->toArray();
            $subjectsData = DB::table('subjects')
                ->whereIn('subjectID', $subjectIds)
                ->select('subjectID', 'subjectName', 'subjectCode')
                ->get()
                ->keyBy('subjectID');
            
            // Group by user and calculate stats
            $userStats = [];
            foreach ($results as $result) {
                $userId = $result->userID;
                
                if (!isset($userStats[$userId])) {
                    $userStats[$userId] = [
                        'userID' => $userId,
                        'highestPercentage' => 0,
                        'highestScore' => 0,
                        'attempts' => 0,
                        'subjectIDs' => [],
                        'bestSubjectID' => null,
                        'bestResultID' => null,
                        'bestCreatedAt' => null,
                    ];
                }
                
                $userStats[$userId]['attempts']++;
                $userStats[$userId]['subjectIDs'][] = $result->subjectID;
                
                $replaceBestResult =
                    $result->percentage > $userStats[$userId]['highestPercentage'] ||
                    (
                        (float) $result->percentage === (float) $userStats[$userId]['highestPercentage'] &&
                        (int) $result->earnedPoints > (int) $userStats[$userId]['highestScore']
                    ) ||
                    (
                        (float) $result->percentage === (float) $userStats[$userId]['highestPercentage'] &&
                        (int) $result->earnedPoints === (int) $userStats[$userId]['highestScore'] &&
                        $userStats[$userId]['bestCreatedAt'] !== null &&
                        Carbon::parse($result->created_at)->lt(Carbon::parse($userStats[$userId]['bestCreatedAt']))
                    );

                if ($replaceBestResult || $userStats[$userId]['bestCreatedAt'] === null) {
                    $userStats[$userId]['highestPercentage'] = $result->percentage;
                    $userStats[$userId]['highestScore'] = $result->earnedPoints;
                    $userStats[$userId]['bestSubjectID'] = $result->subjectID;
                    $userStats[$userId]['bestResultID'] = $result->resultID;
                    $userStats[$userId]['bestCreatedAt'] = $result->created_at;
                }
            }
            
            // Sort by highest percentage, then score, then earliest winning attempt
            uasort($userStats, function($a, $b) {
                $percentageComparison = $b['highestPercentage'] <=> $a['highestPercentage'];
                if ($percentageComparison !== 0) {
                    return $percentageComparison;
                }

                $scoreComparison = $b['highestScore'] <=> $a['highestScore'];
                if ($scoreComparison !== 0) {
                    return $scoreComparison;
                }

                return strtotime((string) $a['bestCreatedAt']) <=> strtotime((string) $b['bestCreatedAt']);
            });
            
            $rankedUsers = [];
            $rank = 1;
            foreach ($userStats as $userId => $stats) {
                $user = $users[$userId] ?? null;
                
                if (!$user) {
                    continue;
                }
                
                $subjectId = $subjectFilter ?: $stats['bestSubjectID'] ?: ($stats['subjectIDs'][0] ?? null);
                $subject = $subjectId ? ($subjectsData[$subjectId] ?? null) : null;
                
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
                    'subject' => $subject ? $subject->subjectName : null,
                    'subjectCode' => $subject ? $subject->subjectCode : null,
                    'subjectID' => $subjectId,
                    'score' => (int) $stats['highestScore'],
                    'highestScore' => (int) $stats['highestScore'],
                    'highestPercentage' => round($stats['highestPercentage'], 2),
                    'attempts' => $stats['attempts'],
                    'points' => (int) $stats['highestScore'],
                    'resultID' => $stats['bestResultID'],
                    'createdAt' => $stats['bestCreatedAt'],
                ];
            }

            $leaderboard = array_slice($rankedUsers, 0, $limit);
            $viewerSummary = $this->buildViewerSummary($viewer, $rankedUsers, $period, $periodEnd);
            
            // Transform programs for mobile dropdown
            $programsList = $programs->map(function($program) {
                return [
                    'programID' => $program->programID,
                    'programName' => $program->programName,
                ];
            });
            
            // Transform subjects for mobile dropdown
            $subjectsList = $subjects->map(function($subject) {
                return [
                    'subjectID' => $subject->subjectID,
                    'subjectName' => $subject->subjectName,
                    'subjectCode' => $subject->subjectCode,
                ];
            });
            
            return response()->json([
                'leaderboard' => $leaderboard,
                'programs' => $programsList,
                'subjects' => $subjectsList,
                'viewer' => $viewerSummary,
                'meta' => [
                    'total' => count($rankedUsers),
                    'programFilter' => $programFilter,
                    'subjectFilter' => $subjectFilter,
                    'period' => $period,
                    'periodStartsAt' => $periodStart ? $periodStart->toIso8601String() : null,
                    'periodEndsAt' => $periodEnd ? $periodEnd->toIso8601String() : null,
                    'generated_from' => 'database'
                ]
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Leaderboard mobile fetch error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'error' => 'Server error: ' . $e->getMessage(),
                'leaderboard' => [],
                'programs' => [],
                'subjects' => [],
                'viewer' => null,
                'meta' => [
                    'period' => $this->normalizePeriod($request->query('period', 'all_time')),
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
            $accessToken = PersonalAccessToken::findToken($token);
            return $accessToken?->tokenable;
        } catch (\Throwable $e) {
            return null;
        }
    }

    protected function buildViewerSummary(?object $viewer, array $rankedUsers, string $period, ?Carbon $periodEnd): ?array
    {
        if (!$viewer || (int) ($viewer->roleID ?? 0) !== 1) {
            return null;
        }

        $totalCandidates = count($rankedUsers);
        $viewerEntry = collect($rankedUsers)->firstWhere('userID', (int) $viewer->userID);
        if (!$viewerEntry) {
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
        }

        $results = $query->get();
        $rank = 1;

        $data = $results->map(function($row) use (&$rank) {
            return [
                'rank' => $rank++,
                'student_id' => $row->student_id,
                'firstName' => $row->firstName,
                'lastName' => $row->lastName,
                'name' => trim(($row->firstName ?? '') . ' ' . ($row->lastName ?? '')),
                'userCode' => $row->userCode,
                'program' => $row->program,
                'score' => (int) $row->score,
                'totalExams' => (int) $row->totalExams,
            ];
        });

        return response()->json([
            'data' => $data,
            'meta' => [
                'scope' => $scope,
                'id' => $id,
                'total' => $data->count(),
                'generated_from' => 'database'
            ]
        ]);
    }
}
