<?php


namespace Modules\Leaderboard\Controllers;

use Illuminate\Routing\Controller;
use Illuminate\Http\Request;
use App\Services\LeaderboardService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

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
     */
    public function index(Request $request)
    {
        $scope = $request->query('scope', 'global');
        $id = $request->query($scope === 'exam' ? 'exam_id' : 'class_id');
        $limit = (int) $request->query('limit', 10);

        $key = $this->leaderboard->buildKey($scope, $id);
        
        try {
            $topRedis = $this->leaderboard->top($key, $limit);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::warning("Redis unavailable for leaderboard: " . $e->getMessage());
            $topRedis = [];
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
                    'programs.programName as course', // Added course alias
                    'students.yearLevel as year', // Added year alias
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

        // Fallback to DB
        return $this->fallbackToDB($scope, $id, $limit);
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
            
            // For now, we return null fields so the UI can show "No score" or a generic message.
            // Alternatively, we could perform a DB fallback here too, but /me is often less critical.
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

        // Potential fallback or "no score"
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

