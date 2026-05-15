<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class StudentAnalyticsFilteringService
{
    /**
     * Get filtered analytics for a student.
     */
    public function getAnalytics(int $studentId, array $filters)
    {
        $cacheKey = $this->generateCacheKey($studentId, $filters);
        $ttl = 3600; // 1 hour

        return Cache::remember($cacheKey, $ttl, function () use ($studentId, $filters) {
            $data = $this->aggregateData($studentId, $filters);
            
            if (empty($data)) {
                return null;
            }

            return $this->formatResponse($studentId, $data, $filters);
        });
    }

    /**
     * Generate a unique cache key based on student ID and filters.
     */
    public function generateCacheKey(int $studentId, array $filters): string
    {
        ksort($filters);
        $hash = md5(json_encode($filters));
        return "analytics:user:{$studentId}:{$hash}";
    }
    
    /**
     * Invalidate analytics cache for a user
     */
    public function invalidateUserCache(int $studentId): void
    {
        try {
            $redis = \Illuminate\Support\Facades\Redis::connection();
            $prefix = config('database.redis.options.prefix', '');
            
            $keys = $redis->keys("{$prefix}analytics:user:{$studentId}:*");
            
            if (!empty($keys)) {
                $keysToDelete = array_map(function($key) use ($prefix) {
                    return str_replace($prefix, '', $key);
                }, $keys);
                
                \Illuminate\Support\Facades\Redis::del($keysToDelete);
            }
        } catch (\Exception $e) {
            Log::error('Cache invalidation failed: ' . $e->getMessage());
        }
    }

    /**
     * Query and aggregate data from multiple assessment tables
     */
    protected function aggregateData(int $studentId, array $filters): array
    {
        $practiceQuery = DB::table('practice_exam_results as per')
            ->join('users as u', 'per.userID', '=', 'u.userID')
            ->select(
                'per.resultID as id',
                'per.userID as student_id',
                'per.subjectID as subject_id',
                DB::raw("'practice' as assessment_type"),
                'per.earnedPoints as earned_points',
                'per.totalPoints as total_points',
                'per.percentage as percentage',
                'per.created_at',
                'u.programID as program_id',
                DB::raw('(SELECT yearLevel FROM students WHERE students.userCode = u.userCode LIMIT 1) as year_level')
            );

        // Subquery for quizzes to get subject_id
        $quizQuery = DB::table('student_quiz_results as sqr')
            ->join('users as u', 'sqr.studentID', '=', 'u.userID')
            ->join('class_personal_quizzes as cpq', 'sqr.class_quiz_assignment_id', '=', 'cpq.classPersonalQuizID')
            ->join('personal_quizzes as pq', 'cpq.personalQuizID', '=', 'pq.personalQuizID')
            ->select(
                'sqr.id',
                'sqr.studentID as student_id',
                'pq.subjectID as subject_id',
                DB::raw("'quiz' as assessment_type"),
                'sqr.score as earned_points',
                'sqr.total_score as total_points',
                'sqr.percentage as percentage',
                'sqr.created_at',
                'u.programID as program_id',
                DB::raw('(SELECT yearLevel FROM students WHERE students.userCode = u.userCode LIMIT 1) as year_level')
            )
            ->whereNotNull('sqr.submitted_at'); 

        // Base UNION query
        $unifiedQuery = DB::query()
            ->fromSub(function ($query) use ($practiceQuery, $quizQuery) {
                $query->from($practiceQuery->unionAll($quizQuery), 'all_assessments');
            }, 'data');

        // Apply filters
        if (!empty($filters['program_id'])) {
            $unifiedQuery->where('program_id', $filters['program_id']);
        }
        
        if (!empty($filters['year_level'])) {
            $unifiedQuery->where('year_level', $filters['year_level']);
        }

        if (!empty($filters['subject_id'])) {
            $unifiedQuery->where('subject_id', $filters['subject_id']);
        }

        if (!empty($filters['assessment_type'])) {
            $unifiedQuery->where('assessment_type', $filters['assessment_type']);
        }

        if (!empty($filters['date_from'])) {
            $unifiedQuery->whereDate('created_at', '>=', $filters['date_from']);
        }

        if (!empty($filters['date_to'])) {
            $unifiedQuery->whereDate('created_at', '<=', $filters['date_to']);
        }
        
        $rankingQuery = clone $unifiedQuery;
        
        $studentQuery = clone $unifiedQuery;
        $studentQuery->where('student_id', $studentId);

        if (!empty($filters['performance_band'])) {
            $this->applyPerformanceBandFilter($studentQuery, $filters['performance_band']);
        }

        $studentResults = $studentQuery->orderBy('created_at', 'asc')->get();

        if ($studentResults->isEmpty()) {
            return [];
        }

        $rankStats = $this->calculateRank($rankingQuery, $studentId);

        return [
            'results' => $studentResults,
            'rank_stats' => $rankStats
        ];
    }

    /**
     * Apply percentage thresholds for performance bands
     */
    protected function applyPerformanceBandFilter($query, string $band): void
    {
        switch ($band) {
            case 'excellent':
                $query->where('percentage', '>=', 80);
                break;
            case 'good':
                $query->whereBetween('percentage', [60, 79.99]);
                break;
            case 'needs_improvement':
                $query->whereBetween('percentage', [41, 59.99]);
                break;
            case 'poor':
                $query->where('percentage', '<=', 40.99);
                break;
        }
    }

    /**
     * Get performance band string from percentage
     */
    protected function getPerformanceBand(float $percentage): string
    {
        if ($percentage >= 80) return 'excellent';
        if ($percentage >= 60) return 'good';
        if ($percentage >= 41) return 'needs_improvement';
        return 'poor';
    }

    /**
     * Calculate student rank based on earned points
     */
    protected function calculateRank($query, int $studentId): array
    {
        $studentAggregates = DB::query()
            ->fromSub($query, 'filtered_data')
            ->select('student_id', DB::raw('SUM(earned_points) as total_earned_points'))
            ->groupBy('student_id')
            ->orderByDesc('total_earned_points')
            ->get();

        $totalCandidates = $studentAggregates->count();
        $rank = null;
        $studentPoints = 0;

        foreach ($studentAggregates as $index => $aggregate) {
            if ($aggregate->student_id == $studentId) {
                $rank = $index + 1;
                $studentPoints = $aggregate->total_earned_points;
                break;
            }
        }

        return [
            'rank' => $rank,
            'total_candidates' => $totalCandidates,
            'total_points_in_scope' => $studentPoints
        ];
    }

    /**
     * Format the response structure
     */
    protected function formatResponse(int $studentId, array $data, array $filters): array
    {
        $results = $data['results'];
        $rankStats = $data['rank_stats'];

        $totalExams = $results->count();
        $totalEarnedPoints = $results->sum('earned_points');
        $overallPercentage = $totalExams > 0 ? round($results->avg('percentage'), 2) : 0;
        
        $passedExams = $results->filter(fn($r) => $r->percentage >= 60)->count();
        $passRate = $totalExams > 0 ? round(($passedExams / $totalExams) * 100, 2) : 0;

        $scoreBreakdown = [
            'excellent' => 0,
            'good' => 0,
            'needs_improvement' => 0,
            'poor' => 0,
        ];

        $progression = [];

        foreach ($results as $result) {
            $band = $this->getPerformanceBand((float) $result->percentage);
            $scoreBreakdown[$band]++;

            $progression[] = [
                'date' => \Carbon\Carbon::parse($result->created_at)->toDateString(),
                'points_earned' => (int) $result->earned_points,
                'percentage' => (float) $result->percentage,
                'assessment_type' => $result->assessment_type,
            ];
        }

        return [
            'summary' => [
                'total_exams' => $totalExams,
                'average_score_percentage' => $overallPercentage,
                'total_earned_points' => $totalEarnedPoints,
                'pass_rate' => $passRate,
            ],
            'score_breakdown' => $scoreBreakdown,
            'progression' => $progression,
            'rank_status' => [
                'rank' => $rankStats['rank'],
                'total_candidates' => $rankStats['total_candidates'],
                'percentile' => $rankStats['total_candidates'] > 0 && $rankStats['rank'] 
                    ? round((($rankStats['total_candidates'] - $rankStats['rank']) / $rankStats['total_candidates']) * 100, 2) 
                    : 0,
            ]
        ];
    }
}
