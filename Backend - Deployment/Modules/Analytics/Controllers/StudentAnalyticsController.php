<?php

namespace Modules\Analytics\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Student Analytics Controller
 * 
 * Provides personalized analytics data for individual students.
 * All queries are automatically scoped to the authenticated user only.
 * 
 * Protected: Requires role 1 (Student) only
 */
class StudentAnalyticsController extends Controller
{
    /**
     * Get personalized summary for the authenticated student.
     * 
     * Includes:
     * - Total exams taken
     * - Average score
     * - Best score
     * - Weakest topic
     * - Achievement count
     * 
     * @return \Illuminate\Http\JsonResponse JSON response with student summary
     */
    public function getSummary(Request $request)
    {
        try {
            // Get authenticated student (role 1 only)
            $user = Auth::user();
            
            if ($user->roleID !== 1) {
                return response()->json(['message' => 'Unauthorized. Student access only.'], 403);
            }
            
            // Get exam statistics
            $examStats = DB::table('practice_exam_results')
                ->where('userID', $user->userID)
                ->select(
                    DB::raw('COUNT(*) as total_exams'),
                    DB::raw('AVG(percentage) as avg_score'),
                    DB::raw('MAX(percentage) as best_score'),
                    DB::raw('MIN(percentage) as lowest_score')
                )
                ->first();
            
            // Get weakest topic (lowest average score) using actual answers
            try {
                $weakestTopic = DB::table('practice_exam_answers')
                    ->join('questions', 'practice_exam_answers.question_id', '=', 'questions.questionID')
                    ->where('practice_exam_answers.user_id', $user->userID)
                    ->select('questions.topic', DB::raw('(SUM(CASE WHEN practice_exam_answers.is_correct = 1 THEN 100 ELSE 0 END) / COUNT(*)) as avg_score'))
                    ->groupBy('questions.topic')
                    ->orderBy('avg_score', 'asc')
                    ->first();
            } catch (\Exception $e) {
                // Table doesn't exist or no data
                $weakestTopic = null;
            }
            
            // Calculate achievement progress
            $totalExamsCount = $examStats->total_exams ?? 0;
            $thresholds = [1, 5, 10, 20, 50, 100];
            $currentVal = 0;
            $nextTarget = 1;
            
            foreach ($thresholds as $t) {
                if ($totalExamsCount >= $t) {
                    $currentVal = $t;
                } else {
                    $nextTarget = $t;
                    break;
                }
            }
            if ($totalExamsCount >= 100) $nextTarget = 100;
            
            $achievementProgress = [
                'current' => $currentVal,
                'next_target' => $nextTarget,
                'label' => "$currentVal of $nextTarget milestones"
            ];
            
            // Get recent trend (last 5 exams)
            $recentExams = DB::table('practice_exam_results')
                ->where('userID', $user->userID)
                ->orderBy('created_at', 'desc')
                ->limit(5)
                ->get();
            
            $trend = 'stable';
            if ($recentExams->count() >= 3) {
                $firstHalf = $recentExams->slice(0, floor($recentExams->count() / 2))->avg('percentage');
                $secondHalf = $recentExams->slice(floor($recentExams->count() / 2))->avg('percentage');
                if ($secondHalf > $firstHalf + 5) {
                    $trend = 'improving';
                } elseif ($secondHalf < $firstHalf - 5) {
                    $trend = 'declining';
                }
            }
            
            return response()->json([
                'message' => 'Student summary retrieved',
                'data' => [
                    'total_exams' => $examStats->total_exams ?? 0,
                    'average_score' => round($examStats->avg_score ?? 0, 2),
                    'best_score' => round($examStats->best_score ?? 0, 2),
                    'lowest_score' => round($examStats->lowest_score ?? 0, 2),
                    'weakest_topic' => $weakestTopic->topic ?? 'N/A',
                    'weakest_topic_score' => round($weakestTopic->avg_score ?? 0, 2),
                    'achievement_progress' => $achievementProgress,
                    'trend' => $trend
                ]
            ], 200);
            
        } catch (\Exception $e) {
            Log::error('Student summary error: ' . $e->getMessage());
            return response()->json(['message' => 'Error retrieving student summary', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Get detailed insights including strong/weak topics and time spent.
     * 
     * @return \Illuminate\Http\JsonResponse JSON response with insights data
     */
    public function getInsights(Request $request)
    {
        try {
            $user = Auth::user();
            
            if ($user->roleID !== 1) {
                return response()->json(['message' => 'Unauthorized. Student access only.'], 403);
            }
            
            // Strong topics (score >= 80%)
            try {
                $strongTopics = DB::table('practice_exam_answers')
                    ->join('questions', 'practice_exam_answers.question_id', '=', 'questions.questionID')
                    ->where('practice_exam_answers.user_id', $user->userID)
                    ->select('questions.topic', DB::raw('(SUM(CASE WHEN practice_exam_answers.is_correct = 1 THEN 100 ELSE 0 END) / COUNT(*)) as avg_score'))
                    ->groupBy('questions.topic')
                    ->having('avg_score', '>=', 80)
                    ->orderByDesc('avg_score')
                    ->limit(5)
                    ->get();
            } catch (\Exception $e) {
                $strongTopics = collect([]);
            }
            
            // Weak topics (score < 60%)
            try {
                $weakTopics = DB::table('practice_exam_answers')
                    ->join('questions', 'practice_exam_answers.question_id', '=', 'questions.questionID')
                    ->where('practice_exam_answers.user_id', $user->userID)
                    ->select('questions.topic', DB::raw('(SUM(CASE WHEN practice_exam_answers.is_correct = 1 THEN 100 ELSE 0 END) / COUNT(*)) as avg_score'))
                    ->groupBy('questions.topic')
                    ->having('avg_score', '<', 60)
                    ->orderBy('avg_score', 'asc')
                    ->limit(5)
                    ->get();
            } catch (\Exception $e) {
                $weakTopics = collect([]);
            }
            
            // Average time spent (Mapped to topic shape)
            // Check if content_analytics table exists
            try {
                $timeSpent = DB::table('content_analytics')
                    ->join('subjects', 'content_analytics.subject_id', '=', 'subjects.subjectID')
                    ->where('content_analytics.user_id', $user->userID)
                    ->whereIn('content_analytics.interaction_type', ['lesson_view', 'quiz_attempt'])
                    ->select(
                        'subjects.subjectName as topic',
                        DB::raw('AVG(content_analytics.time_spent_seconds) as avg_time'),
                        DB::raw('SUM(content_analytics.time_spent_seconds) as total_time'),
                        DB::raw('COUNT(*) as interaction_count')
                    )
                    ->groupBy('subjects.subjectID', 'subjects.subjectName')
                    ->orderByDesc('total_time')
                    ->get();
            } catch (\Exception $e) {
                // Table doesn't exist, return empty collection
                $timeSpent = collect([]);
            }
            
            return response()->json([
                'message' => 'Student insights retrieved',
                'data' => [
                    'strong_topics' => $strongTopics,
                    'weak_topics' => $weakTopics,
                    'time_spent_per_topic' => $timeSpent->map(function($item) {
                        $item->avg_time_formatted = $this->formatTime($item->avg_time);
                        $item->total_time_formatted = $this->formatTime($item->total_time);
                        return $item;
                    })
                ]
            ], 200);
            
        } catch (\Exception $e) {
            Log::error('Student insights error: ' . $e->getMessage());
            return response()->json(['message' => 'Error retrieving insights', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Get historical performance trends for graphing.
     * 
     * Returns exam scores over time for chart visualization.
     * 
     * @param Request $request Optional limit parameter
     * @return \Illuminate\Http\JsonResponse JSON response with trend data
     */
    public function getPerformanceTrends(Request $request)
    {
        try {
            $user = Auth::user();
            
            if ($user->roleID !== 1) {
                return response()->json(['message' => 'Unauthorized. Student access only.'], 403);
            }
            
            $limit = $request->input('limit', 20);
            
            // Get exam history with subject names - most recent first
            $trends = DB::table('practice_exam_results')
                ->join('subjects', 'practice_exam_results.subjectID', '=', 'subjects.subjectID')
                ->where('practice_exam_results.userID', $user->userID)
                ->select(
                    'practice_exam_results.resultID',
                    'practice_exam_results.subjectID',
                    'practice_exam_results.percentage',
                    'practice_exam_results.totalPoints',
                    'practice_exam_results.earnedPoints',
                    'practice_exam_results.created_at',
                    'subjects.subjectName'
                )
                ->orderBy('practice_exam_results.created_at', 'desc')
                ->limit($limit)
                ->get();
            
            // Calculate moving average (last 5 exams)
            $movingAvg = [];
            $windowSize = 5;
            for ($i = 0; $i < $trends->count(); $i++) {
                if ($i < $windowSize - 1) {
                    $movingAvg[] = null;
                } else {
                    $window = $trends->slice($i - $windowSize + 1, $windowSize);
                    $movingAvg[] = round($window->avg('percentage'), 2);
                }
            }
            
            // Add moving average to response
            $trends = $trends->map(function ($item, $index) use ($movingAvg) {
                $item->moving_average = $movingAvg[$index];
                return $item;
            });
            
            return response()->json([
                'message' => 'Performance trends retrieved',
                'data' => $trends,
                'summary' => [
                    'total_exams' => $trends->count(),
                    'avg_score' => round($trends->avg('percentage') ?? 0, 2),
                    'highest_score' => round($trends->max('percentage') ?? 0, 2),
                    'lowest_score' => round($trends->min('percentage') ?? 0, 2)
                ]
            ], 200);
            
        } catch (\Exception $e) {
            Log::error('Performance trends error: ' . $e->getMessage());
            return response()->json(['message' => 'Error retrieving trends', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Helper: Format seconds into readable time string.
     * 
     * @param int $seconds Time in seconds
     * @return string Formatted time (e.g., "5m 30s")
     */
    private function formatTime($seconds)
    {
        if ($seconds < 60) {
            return round($seconds) . 's';
        } elseif ($seconds < 3600) {
            $minutes = floor($seconds / 60);
            $remainingSeconds = $seconds % 60;
            return $minutes . 'm ' . round($remainingSeconds) . 's';
        } else {
            $hours = floor($seconds / 3600);
            $minutes = floor(($seconds % 3600) / 60);
            return $hours . 'h ' . $minutes . 'm';
        }
    }
}