<?php

namespace Modules\Analytics\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Admin Analytics Controller
 * 
 * Provides analytics data for administrators and teachers to analyze
 * student performance across the platform.
 * 
 * All queries automatically filter by the authenticated user's
 * programID and campusID to prevent data leakage between institutions.
 * 
 * Protected: Requires role 2 (Faculty), 3 (Program Chair), 4 (Dean), or 5 (Associate Dean)
 */
class AdminAnalyticsController extends Controller
{
    /**
     * Get comprehensive summary of all analytics metrics.
     * 
     * Aggregates key performance indicators including:
     * - Total students
     * - Average score across all exams
     * - Pass rate percentage
     * - Total exams completed
     * 
     * @param Request $request HTTP request object
     * @return \Illuminate\Http\JsonResponse JSON response with summary data
     */
    public function getSummary(Request $request)
    {
        try {
            // Get authenticated user for permission scoping
            $user = Auth::user();
            
            // Build query with role-based filtering
            $query = DB::table('practice_exam_results')
                ->join('users', 'practice_exam_results.userID', '=', 'users.userID');
            
            // Apply role-based data scoping to prevent data leakage
            $query = $this->applyRoleBasedScope($query, $user);
            
            // Calculate summary metrics
            $totalStudents = (clone $query)->count(DB::raw('DISTINCT userID'));
            $totalExams = (clone $query)->count();
            $avgScore = (clone $query)->avg('percentage') ?? 0;
            
            // Calculate pass rate (60% threshold)
            $passCount = (clone $query)->where('percentage', '>=', 60)->count();
            $passRate = $totalExams > 0 ? ($passCount / $totalExams) * 100 : 0;
            
            $currentMonthAvg = (clone $query)->whereMonth('practice_exam_results.created_at', now()->month)->avg('percentage') ?? 0;
            $previousMonthAvg = (clone $query)->whereMonth('practice_exam_results.created_at', now()->subMonth()->month)->avg('percentage') ?? 0;
            $improvement = $previousMonthAvg > 0 ? (($currentMonthAvg - $previousMonthAvg) / $previousMonthAvg) : 0;
            
            // Active students (last 30 days)
            $activeStudents = (clone $query)->where('practice_exam_results.created_at', '>=', now()->subDays(30))->count(DB::raw('DISTINCT practice_exam_results.userID'));

            return response()->json([
                'message' => 'Analytics summary retrieved successfully',
                'data' => [
                    'active_students' => $activeStudents,
                    'total_students' => $totalStudents,
                    'total_exams' => $totalExams,
                    'average_score' => round($avgScore, 2),
                    'pass_rate' => round($passRate / 100, 2),
                    'improvement_percentage' => round($improvement, 2),
                    'fail_rate' => round((100 - $passRate) / 100, 2)
                ]
            ], 200);
            
        } catch (\Exception $e) {
            Log::error('Admin analytics summary error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error retrieving analytics summary',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get average score per subject for admin dashboard.
     * 
     * Groups exam results by subject and calculates mean percentage.
     * 
     * @return \Illuminate\Http\JsonResponse JSON response with per-subject averages
     */
    public function getAverageScorePerSubject(Request $request)
    {
        try {
            $user = Auth::user();
            
            $results = DB::table('practice_exam_results')
                ->join('users', 'practice_exam_results.userID', '=', 'users.userID')
                ->join('subjects', 'practice_exam_results.subjectID', '=', 'subjects.subjectID')
                ->where(function($query) use ($user) {
                    $this->applyRoleBasedScope($query, $user);
                })
                ->select(
                    'subjects.subjectID',
                    'subjects.subjectName',
                    DB::raw('AVG(practice_exam_results.percentage) as avg_score'),
                    DB::raw('COUNT(practice_exam_results.resultID) as exam_count')
                )
                ->groupBy('subjects.subjectID', 'subjects.subjectName')
                ->orderByDesc('avg_score')
                ->get();
            
            return response()->json([
                'message' => 'Average scores per subject retrieved',
                'data' => $results
            ], 200);
            
        } catch (\Exception $e) {
            Log::error('Average score per subject error: ' . $e->getMessage());
            return response()->json(['message' => 'Error retrieving subject analytics', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Get student progress over time (weekly/monthly trends).
     * 
     * Tracks average scores across time periods to identify trends.
     * 
     * @param Request $request Request with optional 'period' param (week/month)
     * @return \Illuminate\Http\JsonResponse JSON response with progress data
     */
    public function getStudentProgress(Request $request)
    {
        try {
            $user = Auth::user();
            $period = $request->input('period', 'week'); // week or month
            
            $dateFormat = $period === 'month' ? '%Y-%m' : '%Y-%m-%d';
            
            $results = DB::table('practice_exam_results')
                ->join('users', 'practice_exam_results.userID', '=', 'users.userID')
                ->where(function($query) use ($user) {
                    $this->applyRoleBasedScope($query, $user);
                })
                ->where('practice_exam_results.created_at', '>=', now()->subMonths(6))
                ->select(
                    DB::raw("DATE_FORMAT(practice_exam_results.created_at, '{$dateFormat}') as period"),
                    DB::raw('AVG(practice_exam_results.percentage) as avg_score'),
                    DB::raw('COUNT(DISTINCT userID) as student_count'),
                    DB::raw('COUNT(resultID) as exam_count')
                )
                ->groupBy('period')
                ->orderBy('period')
                ->get();
            
            return response()->json([
                'message' => 'Student progress data retrieved',
                'data' => $results,
                'period' => $period
            ], 200);
            
        } catch (\Exception $e) {
            Log::error('Student progress error: ' . $e->getMessage());
            return response()->json(['message' => 'Error retrieving progress data', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Get pass vs fail rate statistics.
     * 
     * Uses 60% as the pass threshold.
     * 
     * @return \Illuminate\Http\JsonResponse JSON response with pass/fail metrics
     */
    public function getPassFailRate(Request $request)
    {
        try {
            $user = Auth::user();
            
            $stats = DB::table('practice_exam_results')
                ->join('users', 'practice_exam_results.userID', '=', 'users.userID')
                ->where(function($query) use ($user) {
                    $this->applyRoleBasedScope($query, $user);
                })
                ->select(
                    DB::raw('COUNT(*) as total'),
                    DB::raw('SUM(CASE WHEN percentage >= 60 THEN 1 ELSE 0 END) as passed'),
                    DB::raw('SUM(CASE WHEN percentage < 60 THEN 1 ELSE 0 END) as failed'),
                    DB::raw('SUM(CASE WHEN percentage >= 80 THEN 1 ELSE 0 END) as excellent'),
                    DB::raw('SUM(CASE WHEN percentage >= 60 AND percentage < 80 THEN 1 ELSE 0 END) as good'),
                    DB::raw('SUM(CASE WHEN percentage < 60 AND percentage >= 40 THEN 1 ELSE 0 END) as needs_improvement'),
                    DB::raw('SUM(CASE WHEN percentage < 40 THEN 1 ELSE 0 END) as poor')
                )
                ->first();
            
            $total = $stats->total ?? 0;
            
            return response()->json([
                'message' => 'Pass/fail rate retrieved',
                'data' => [
                    'total' => $total,
                    'passed' => $stats->passed ?? 0,
                    'failed' => $stats->failed ?? 0,
                    'pass_rate' => $total > 0 ? round(($stats->passed / $total) * 100, 2) : 0,
                    'breakdown' => [
                        'excellent' => $stats->excellent ?? 0,  // 80%+
                        'good' => $stats->good ?? 0,            // 60-79%
                        'needs_improvement' => $stats->needs_improvement ?? 0, // 40-59%
                        'poor' => $stats->poor ?? 0              // <40%
                    ]
                ]
            ], 200);
            
        } catch (\Exception $e) {
            Log::error('Pass/fail rate error: ' . $e->getMessage());
            return response()->json(['message' => 'Error retrieving pass/fail data', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Calculate month-over-month improvement percentage.
     * 
     * Compares current month average to previous month.
     * 
     * @return \Illuminate\Http\JsonResponse JSON response with improvement metrics
     */
    public function getImprovementPercentage(Request $request)
    {
        try {
            $user = Auth::user();
            
            // Current month average
            $currentMonth = DB::table('practice_exam_results')
                ->join('users', 'practice_exam_results.userID', '=', 'users.userID')
                ->where(function($query) use ($user) {
                    $this->applyRoleBasedScope($query, $user);
                })
                ->whereMonth('practice_exam_results.created_at', now()->month)
                ->avg('percentage') ?? 0;
            
            // Previous month average
            $previousMonth = DB::table('practice_exam_results')
                ->join('users', 'practice_exam_results.userID', '=', 'users.userID')
                ->where(function($query) use ($user) {
                    $this->applyRoleBasedScope($query, $user);
                })
                ->whereMonth('practice_exam_results.created_at', now()->subMonth()->month)
                ->avg('percentage') ?? 0;
            
            // Calculate improvement percentage
            $improvement = $previousMonth > 0 
                ? (($currentMonth - $previousMonth) / $previousMonth) * 100 
                : 0;
            
            return response()->json([
                'message' => 'Improvement percentage calculated',
                'data' => [
                    'current_month_avg' => round($currentMonth, 2),
                    'previous_month_avg' => round($previousMonth, 2),
                    'improvement_percentage' => round($improvement, 2),
                    'trend' => $improvement > 0 ? 'improving' : ($improvement < 0 ? 'declining' : 'stable')
                ]
            ], 200);
            
        } catch (\Exception $e) {
            Log::error('Improvement percentage error: ' . $e->getMessage());
            return response()->json(['message' => 'Error calculating improvement', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Get topic mastery levels from difficulty analytics.
     * 
     * Shows which topics students find easy or difficult.
     * 
     * @return \Illuminate\Http\JsonResponse JSON response with topic mastery data
     */
    public function getTopicMastery(Request $request)
    {
        try {
            $user = Auth::user();
            
            // Get difficulty analytics joined with questions for topic info
            $results = DB::table('learning_difficulty_analytics')
                ->join('questions', 'learning_difficulty_analytics.question_id', '=', 'questions.questionID')
                ->join('subjects', 'learning_difficulty_analytics.subject_id', '=', 'subjects.subjectID')
                ->select(
                    'subjects.subjectName',
                    'questions.topic',
                    DB::raw('AVG(learning_difficulty_analytics.difficulty_index) as avg_difficulty'),
                    DB::raw('SUM(learning_difficulty_analytics.total_attempts) as total_attempts'),
                    DB::raw('AVG(learning_difficulty_analytics.average_attempts) as avg_attempts')
                )
                ->groupBy('subjects.subjectName', 'questions.topic')
                ->orderBy('avg_difficulty', 'desc')
                ->limit(20)
                ->get();
            
            return response()->json([
                'message' => 'Topic mastery data retrieved',
                'data' => $results->map(function($item) {
                    // Classify mastery level based on difficulty index
                    if ($item->avg_difficulty <= 0.3) {
                        $item->mastery_level = 'easy';
                    } elseif ($item->avg_difficulty <= 0.7) {
                        $item->mastery_level = 'moderate';
                    } else {
                        $item->mastery_level = 'difficult';
                    }
                    return $item;
                })
            ], 200);
            
        } catch (\Exception $e) {
            Log::error('Topic mastery error: ' . $e->getMessage());
            return response()->json(['message' => 'Error retrieving topic mastery', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Get content analytics (views, attempts, skips).
     * 
     * Shows engagement metrics for learning content.
     * 
     * @return \Illuminate\Http\JsonResponse JSON response with content engagement data
     */
    public function getContentAnalytics(Request $request)
    {
        try {
            $user = Auth::user();
            
            // Most viewed lessons
            $mostViewed = DB::table('content_analytics')
                ->join('subjects', 'content_analytics.subject_id', '=', 'subjects.subjectID')
                ->where('content_analytics.interaction_type', 'lesson_view')
                ->select('subjects.subjectID as lesson_id', 'subjects.subjectName as lesson_title', DB::raw('COUNT(*) as views'))
                ->groupBy('subjects.subjectID', 'subjects.subjectName')
                ->orderByDesc('views')
                ->limit(10)
                ->get();
            
            // Most attempted questions
            $mostAttempted = DB::table('practice_exam_answers')
                ->join('questions', 'practice_exam_answers.question_id', '=', 'questions.questionID')
                ->select('questions.questionID as question_id', 'questions.topic as question_preview', DB::raw('COUNT(*) as attempts'))
                ->groupBy('questions.questionID', 'questions.topic')
                ->orderByDesc('attempts')
                ->limit(10)
                ->get();
            
            // Most skipped topics
            $mostSkipped = DB::table('practice_exam_answers')
                ->join('questions', 'practice_exam_answers.question_id', '=', 'questions.questionID')
                ->whereNull('practice_exam_answers.selected_choice_id')
                ->select('questions.topic', DB::raw('COUNT(*) as skip_count'))
                ->groupBy('questions.topic')
                ->orderByDesc('skip_count')
                ->limit(10)
                ->get();
            
            // Highest error rate questions
            $highErrorRate = DB::table('practice_exam_answers')
                ->join('questions', 'practice_exam_answers.question_id', '=', 'questions.questionID')
                ->select(
                    'questions.questionID as question_id',
                    'questions.topic as question_preview',
                    DB::raw('(SUM(CASE WHEN practice_exam_answers.is_correct = 0 THEN 1 ELSE 0 END) / COUNT(*)) as error_rate')
                )
                ->groupBy('questions.questionID', 'questions.topic')
                ->havingRaw('COUNT(*) > 0')
                ->orderByDesc('error_rate')
                ->limit(10)
                ->get();
            
            return response()->json([
                'message' => 'Content analytics retrieved',
                'data' => [
                    'most_viewed_lessons' => $mostViewed,
                    'most_attempted_quiz_questions' => $mostAttempted,
                    'most_skipped_topics' => $mostSkipped,
                    'highest_error_questions' => $highErrorRate
                ]
            ], 200);
            
        } catch (\Exception $e) {
            Log::error('Content analytics error: ' . $e->getMessage());
            return response()->json(['message' => 'Error retrieving content analytics', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Apply role-based data scoping to prevent data leakage.
     * 
     * Different roles see different data scopes:
     * - Dean (4): All data in their campus
     * - Associate Dean (5): All data in their campus
     * - Program Chair (3): Data in their program
     * - Faculty (2): Data in their program only
     * 
     * @param \Illuminate\Database\Query\Builder $query The query to scope
     * @param \Modules\Users\Models\User $user The authenticated user
     * @return \Illuminate\Database\Query\Builder The scoped query
     */
    private function applyRoleBasedScope($query, $user)
    {
        switch ($user->roleID) {
            case 4: // Dean - all campus data
            case 5: // Associate Dean - all campus data
                if ($user->campusID) {
                    $query->where('users.campusID', $user->campusID);
                }
                break;
            case 3: // Program Chair - program data
                if ($user->campusID && $user->programID) {
                    $query->where('users.campusID', $user->campusID)
                          ->where('users.programID', $user->programID);
                }
                break;
            case 2: // Faculty - only their students
                if ($user->campusID && $user->programID) {
                    $query->where('users.campusID', $user->campusID)
                          ->where('users.programID', $user->programID);
                }
                break;
            default:
                // No access by default
                $query->whereRaw('1 = 0');
        }
        
        return $query;
    }
}