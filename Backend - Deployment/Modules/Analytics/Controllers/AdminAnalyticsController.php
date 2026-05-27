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
            // Build query on users table to count total students scoped by role/campus/program
            $studentCountQuery = DB::table('users')
                ->where('roleID', 1)
                ->where('isActive', true);

            switch ($user->roleID) {
                case 4: // Dean
                case 5: // Associate Dean
                    if ($user->campusID) {
                        $studentCountQuery->where('campusID', $user->campusID);
                    }
                    break;
                case 3: // Program Chair
                case 2: // Faculty
                    if ($user->campusID && $user->programID) {
                        $studentCountQuery->where('campusID', $user->campusID)
                                          ->where('programID', $user->programID);
                    }
                    break;
                default:
                    $studentCountQuery->whereRaw('1 = 0');
            }
            $totalStudents = $studentCountQuery->count();

            // Program breakdown of students
            $programQuery = DB::table('users')
                ->join('programs', 'users.programID', '=', 'programs.programID')
                ->where('users.roleID', 1)
                ->where('users.isActive', true);

            switch ($user->roleID) {
                case 4: // Dean
                case 5: // Associate Dean
                    if ($user->campusID) {
                        $programQuery->where('users.campusID', $user->campusID);
                    }
                    break;
                case 3: // Program Chair
                case 2: // Faculty
                    if ($user->campusID && $user->programID) {
                        $programQuery->where('users.campusID', $user->campusID)
                                     ->where('users.programID', $user->programID);
                    }
                    break;
                default:
                    $programQuery->whereRaw('1 = 0');
            }

            $programStatsRaw = $programQuery
                ->select('programs.programName', 'programs.programName2', DB::raw('count(users.userID) as count'))
                ->groupBy('programs.programID', 'programs.programName', 'programs.programName2')
                ->get();

            $programStats = [];
            foreach ($programStatsRaw as $ps) {
                $programStats[] = [
                    'programName' => $ps->programName,
                    'programName2' => $ps->programName2,
                    'count' => $ps->count
                ];
            }

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
                    'fail_rate' => round((100 - $passRate) / 100, 4),
                    'program_stats' => $programStats
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
     * Get dashboard statistics for Dean/Associate Dean.
     * Returns active user count, subject count, and approved question count.
     * Single endpoint to replace the N+1 dashboard fetch pattern.
     *
     * GET /api/dashboard/stats
     * Auth: role 2, 3, 4, 5
     */
    public function getDashboardStats(Request $request)
    {
        try {
            $user = Auth::user();

            $usersQuery = DB::table('users')->where('isActive', true);
            $subjectsQuery = DB::table('subjects');

            // Role-based scope (Dean=4 sees all, Program Chair=3 sees own program only)
            if ($user->roleID === 5) {
                if ($user->campusID) {
                    $usersQuery->where('campusID', $user->campusID);
                }
            } elseif ($user->roleID === 3) {
                if ($user->campusID && $user->programID) {
                    $usersQuery->where('campusID', $user->campusID)->where('programID', $user->programID);
                    $subjectsQuery->where(function ($q) use ($user) {
                        $q->where('programID', $user->programID)->orWhere('programID', 6);
                    });
                }
            }
            // Dean (roleID 4) — no extra filters, sees all campus data

            // Split counts: students vs faculty
            $students = (clone $usersQuery)->where('roleID', 1)->count();
            $faculty = (clone $usersQuery)->whereIn('roleID', [2, 3, 4, 5])->count();
            $totalSubjects = (clone $subjectsQuery)->count();

            // Count approved questions scoped to the same subject filters.
            $approvedQuestions = DB::table('questions')
                ->where('status_id', 2)
                ->where(function ($q) use ($user) {
                    if ($user->roleID === 3 && $user->campusID && $user->programID) {
                        $q->whereIn('subjectID', function ($sub) use ($user) {
                            $sub->select('subjectID')
                                ->from('subjects')
                                ->where('programID', $user->programID)
                                ->orWhere('programID', 6);
                        });
                    }
                })
                ->count();

            // Program count scoped by campus
            $programsQuery = DB::table('programs');
            if ($user->roleID === 5 && $user->campusID) {
                $programsQuery->where('campusID', $user->campusID);
            } elseif ($user->roleID === 3 && $user->programID) {
                $programsQuery->where('programID', $user->programID);
            }
            $totalPrograms = $programsQuery->count();

            // Exam analytics scoped by role
            $examQuery = DB::table('practice_exam_results')
                ->join('users', 'practice_exam_results.userID', '=', 'users.userID');
            $examQuery = $this->applyRoleBasedScope($examQuery, $user);

            $totalExams = (clone $examQuery)->count();
            $avgScore = (clone $examQuery)->avg('percentage') ?? 0;

            $passCount = (clone $examQuery)->where('percentage', '>=', 60)->count();
            $passRate = $totalExams > 0 ? ($passCount / $totalExams) : 0;

            $currentMonthAvg = (clone $examQuery)->whereMonth('practice_exam_results.created_at', now()->month)->avg('percentage') ?? 0;
            $previousMonthAvg = (clone $examQuery)->whereMonth('practice_exam_results.created_at', now()->subMonth()->month)->avg('percentage') ?? 0;
            $improvement = $previousMonthAvg > 0 ? (($currentMonthAvg - $previousMonthAvg) / $previousMonthAvg) : 0;

            return response()->json([
                'message' => 'Dashboard stats retrieved successfully',
                'data' => [
                    'students' => $students,
                    'faculty' => $faculty,
                    'subjects' => $totalSubjects,
                    'questions' => $approvedQuestions,
                    'programs' => $totalPrograms,
                    'average_score' => round($avgScore, 2),
                    'pass_rate' => round($passRate, 4),
                    'improvement_percentage' => round($improvement, 2),
                ]
            ], 200);
        } catch (\Exception $e) {
            Log::error('Dashboard stats error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error retrieving stats',
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
                ->when(true, fn ($query) => $this->applyRoleBasedScope($query, $user))
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
                ->when(true, fn ($query) => $this->applyRoleBasedScope($query, $user))
                ->where('practice_exam_results.created_at', '>=', now()->subMonths(6))
                ->select(
                    DB::raw("DATE_FORMAT(practice_exam_results.created_at, '{$dateFormat}') as period"),
                    DB::raw('AVG(practice_exam_results.percentage) as avg_score'),
                    DB::raw('COUNT(DISTINCT practice_exam_results.userID) as student_count'),
                    DB::raw('COUNT(practice_exam_results.resultID) as exam_count')
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
                ->when(true, fn ($query) => $this->applyRoleBasedScope($query, $user))
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
                    'pass_rate' => $total > 0 ? round($stats->passed / $total, 4) : 0,
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
                ->when(true, fn ($query) => $this->applyRoleBasedScope($query, $user))
                ->whereMonth('practice_exam_results.created_at', now()->month)
                ->avg('percentage') ?? 0;
            
            // Previous month average
            $previousMonth = DB::table('practice_exam_results')
                ->join('users', 'practice_exam_results.userID', '=', 'users.userID')
                ->when(true, fn ($query) => $this->applyRoleBasedScope($query, $user))
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
                ->join('users as question_users', 'questions.userID', '=', 'question_users.userID')
                ->when(true, fn ($query) => $this->applyRoleBasedScope($query, $user, 'question_users'))
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
                ->join('users', 'content_analytics.user_id', '=', 'users.userID')
                ->when(true, fn ($query) => $this->applyRoleBasedScope($query, $user))
                ->where('content_analytics.interaction_type', 'lesson_view')
                ->select('subjects.subjectID as lesson_id', 'subjects.subjectName as lesson_title', DB::raw('COUNT(*) as views'))
                ->groupBy('subjects.subjectID', 'subjects.subjectName')
                ->orderByDesc('views')
                ->limit(10)
                ->get();
            
            // Most attempted questions
            $mostAttempted = DB::table('practice_exam_answers')
                ->join('questions', 'practice_exam_answers.question_id', '=', 'questions.questionID')
                ->join('users', 'practice_exam_answers.user_id', '=', 'users.userID')
                ->when(true, fn ($query) => $this->applyRoleBasedScope($query, $user))
                ->select('questions.questionID as question_id', 'questions.topic as question_preview', DB::raw('COUNT(*) as attempts'))
                ->groupBy('questions.questionID', 'questions.topic')
                ->orderByDesc('attempts')
                ->limit(10)
                ->get();
            
            // Most skipped topics
            $mostSkipped = DB::table('practice_exam_answers')
                ->join('questions', 'practice_exam_answers.question_id', '=', 'questions.questionID')
                ->join('users', 'practice_exam_answers.user_id', '=', 'users.userID')
                ->when(true, fn ($query) => $this->applyRoleBasedScope($query, $user))
                ->whereNull('practice_exam_answers.selected_choice_id')
                ->select('questions.topic', DB::raw('COUNT(*) as skip_count'))
                ->groupBy('questions.topic')
                ->orderByDesc('skip_count')
                ->limit(10)
                ->get();
            
            // Highest error rate questions
            $highErrorRate = DB::table('practice_exam_answers')
                ->join('questions', 'practice_exam_answers.question_id', '=', 'questions.questionID')
                ->join('users', 'practice_exam_answers.user_id', '=', 'users.userID')
                ->when(true, fn ($query) => $this->applyRoleBasedScope($query, $user))
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
     * Get program comparison data for Associate Dean dashboard.
     *
     * Returns per-program average scores computed from practice exam results,
     * grouped by the program associated with each subject.
     *
     * GET /api/admin/analytics/program-comparison
     * Auth: role 2, 3, 4, 5
     *
     * @param Request $request HTTP request object
     * @return \Illuminate\Http\JsonResponse JSON response with program comparison data
     */
    public function getProgramComparison(Request $request)
    {
        try {
            $user = Auth::user();

            $results = DB::table('practice_exam_results')
                ->join('users', 'practice_exam_results.userID', '=', 'users.userID')
                ->join('subjects', 'practice_exam_results.subjectID', '=', 'subjects.subjectID')
                ->join('programs', 'subjects.programID', '=', 'programs.programID')
                ->when(true, fn ($query) => $this->applyRoleBasedScope($query, $user))
                ->select(
                    'programs.programID',
                    'programs.programName',
                    'programs.programName2',
                    DB::raw('AVG(practice_exam_results.percentage) as average_score'),
                    DB::raw('COUNT(practice_exam_results.resultID) as exam_count'),
                    DB::raw('COUNT(DISTINCT practice_exam_results.userID) as student_count'),
                    DB::raw('ROUND(SUM(CASE WHEN practice_exam_results.percentage >= 60 THEN 1 ELSE 0 END) / COUNT(*) * 100, 2) as pass_rate')
                )
                ->groupBy('programs.programID', 'programs.programName', 'programs.programName2')
                ->orderByDesc('average_score')
                ->get();

            return response()->json([
                'message' => 'Program comparison data retrieved',
                'data' => $results
            ], 200);

        } catch (\Exception $e) {
            Log::error('Program comparison error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error retrieving program comparison data',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get comprehensive analytics data for Dean/Associate Dean.
     * 
     * Returns all students, programs, feedback, and tickets for the campus.
     * Only accessible by Dean (4) or Associate Dean (5).
     * 
     * @return \Illuminate\Http\JsonResponse JSON response with all campus data
     */
    public function getAllAnalytics(Request $request)
    {
        try {
            $user = Auth::user();
            
            // Check role authorization
            if (!in_array($user->roleID, [4, 5])) {
                return response()->json([
                    'message' => 'Unauthorized. This endpoint is only for Dean and Associate Dean.',
                    'error' => 'Insufficient permissions'
                ], 403);
            }
            
            // Build base query for campus-wide data
            $baseQuery = DB::table('users')
                ->where('users.campusID', $user->campusID)
                ->where('users.roleID', 1); // Students only
            
            // Get all students in campus
            $students = (clone $baseQuery)
                ->select('userID', 'name', 'email', 'programID', 'yearLevel')
                ->orderBy('programID')
                ->orderBy('yearLevel')
                ->get();
            
            // Get all programs in campus
            $programs = DB::table('programs')
                ->where('campusID', $user->campusID)
                ->select('programID', 'programName', 'programCode')
                ->orderBy('programName')
                ->get();
            
            // Get feedback data for campus
            $feedbackStats = DB::table('user_feedback')
                ->join('users', 'user_feedback.user_id', '=', 'users.userID')
                ->where('users.campusID', $user->campusID)
                ->select(
                    DB::raw('COUNT(*) as total_feedback'),
                    DB::raw('COUNT(DISTINCT user_feedback.user_id) as unique_users'),
                    'issue_type',
                    DB::raw('COUNT(CASE WHEN status = "New" THEN 1 END) as new_feedback'),
                    DB::raw('COUNT(CASE WHEN status = "In Progress" THEN 1 END) as in_progress'),
                    DB::raw('COUNT(CASE WHEN status = "Resolved" THEN 1 END) as resolved')
                )
                ->groupBy('issue_type')
                ->get();
            
            // Get support tickets data for campus
            $ticketStats = DB::table('support_tickets')
                ->join('users', 'support_tickets.userID', '=', 'users.userID')
                ->where('users.campusID', $user->campusID)
                ->select(
                    DB::raw('COUNT(*) as total_tickets'),
                    DB::raw('COUNT(DISTINCT support_tickets.userID) as unique_users'),
                    'status',
                    'priority',
                    DB::raw('COUNT(CASE WHEN status = "Open" THEN 1 END) as open_tickets'),
                    DB::raw('COUNT(CASE WHEN status = "Closed" THEN 1 END) as closed_tickets')
                )
                ->groupBy('status', 'priority')
                ->get();
            
            return response()->json([
                'message' => 'Campus analytics retrieved successfully',
                'data' => [
                    'students' => [
                        'total_count' => $students->count(),
                        'by_program' => $students->groupBy('programID')->map(function($programStudents) {
                            return [
                                'program_id' => $programStudents->first()->programID,
                                'student_count' => $programStudents->count(),
                                'by_year_level' => $programStudents->groupBy('yearLevel')->map->count()
                            ];
                        })->values()
                    ],
                    'programs' => $programs,
                    'feedback' => [
                        'total_feedback' => $feedbackStats->sum('total_feedback'),
                        'unique_users' => $feedbackStats->sum('unique_users'),
                        'by_issue_type' => $feedbackStats,
                        'by_status' => [
                            'new' => $feedbackStats->sum('new_feedback'),
                            'in_progress' => $feedbackStats->sum('in_progress'),
                            'resolved' => $feedbackStats->sum('resolved')
                        ]
                    ],
                    'support_tickets' => [
                        'total_tickets' => $ticketStats->sum('total_tickets'),
                        'unique_users' => $ticketStats->sum('unique_users'),
                        'by_status' => [
                            'open' => $ticketStats->sum('open_tickets'),
                            'closed' => $ticketStats->sum('closed_tickets')
                        ],
                        'by_priority' => $ticketStats->groupBy('priority')->map(function($group) {
                            return [
                                'priority' => $group->first()->priority,
                                'count' => $group->sum('total_tickets')
                            ];
                        })->values()
                    ]
                ]
            ], 200);
            
        } catch (\Exception $e) {
            Log::error('Get all analytics error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error retrieving campus analytics',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get program-specific analytics for Program Chair.
     * 
     * Returns only students from the Program Chair's assigned program.
     * Only accessible by Program Chair (3).
     * 
     * @param int $programId Program ID to check authorization
     * @return \Illuminate\Http\JsonResponse JSON response with program data
     */
    public function getProgramAnalytics(Request $request, $programId)
    {
        try {
            $user = Auth::user();
            
            // Check role authorization and program assignment
            if ($user->roleID !== 3 || $user->programID != $programId) {
                return response()->json([
                    'message' => 'Unauthorized. This endpoint is only for Program Chairs of their assigned program.',
                    'error' => 'Insufficient permissions or wrong program'
                ], 403);
            }
            
            // Get program details
            $program = DB::table('programs')
                ->where('programID', $programId)
                ->where('campusID', $user->campusID)
                ->first();
            
            if (!$program) {
                return response()->json([
                    'message' => 'Program not found',
                    'error' => 'Invalid program ID'
                ], 404);
            }
            
            // Get students in program (levels 1-4)
            $students = DB::table('users')
                ->where('programID', $programId)
                ->where('campusID', $user->campusID)
                ->where('roleID', 1) // Students only
                ->where('yearLevel', '>=', 1)
                ->where('yearLevel', '<=', 4)
                ->select('userID', 'name', 'email', 'yearLevel')
                ->orderBy('yearLevel')
                ->orderBy('name')
                ->get();
            
            // Get feedback data for program
            $feedbackStats = DB::table('user_feedback')
                ->join('users', 'user_feedback.user_id', '=', 'users.userID')
                ->where('users.programID', $programId)
                ->where('users.campusID', $user->campusID)
                ->select(
                    DB::raw('COUNT(*) as total_feedback'),
                    DB::raw('COUNT(DISTINCT user_feedback.user_id) as unique_users'),
                    'issue_type',
                    DB::raw('COUNT(CASE WHEN status = "New" THEN 1 END) as new_feedback'),
                    DB::raw('COUNT(CASE WHEN status = "In Progress" THEN 1 END) as in_progress'),
                    DB::raw('COUNT(CASE WHEN status = "Resolved" THEN 1 END) as resolved')
                )
                ->groupBy('issue_type')
                ->get();
            
            // Get academic performance for program
            $academicStats = DB::table('practice_exam_results')
                ->join('users', 'practice_exam_results.userID', '=', 'users.userID')
                ->where('users.programID', $programId)
                ->where('users.campusID', $user->campusID)
                ->select(
                    DB::raw('COUNT(*) as total_exams'),
                    DB::raw('COUNT(DISTINCT practice_exam_results.userID) as student_count'),
                    DB::raw('AVG(practice_exam_results.percentage) as avg_score'),
                    DB::raw('COUNT(CASE WHEN practice_exam_results.percentage >= 60 THEN 1 END) as passed'),
                    DB::raw('COUNT(CASE WHEN practice_exam_results.percentage < 60 THEN 1 END) as failed')
                )
                ->first();
            
            return response()->json([
                'message' => 'Program analytics retrieved successfully',
                'data' => [
                    'program' => $program,
                    'students' => [
                        'total_count' => $students->count(),
                        'by_year_level' => $students->groupBy('yearLevel')->map(function($yearStudents, $yearLevel) {
                            return [
                                'year_level' => $yearLevel,
                                'student_count' => $yearStudents->count(),
                                'students' => $yearStudents->map(function($student) {
                                    return [
                                        'user_id' => $student->userID,
                                        'name' => $student->name,
                                        'email' => $student->email
                                    ];
                                })
                            ];
                        })
                    ],
                    'feedback' => [
                        'total_feedback' => $feedbackStats->sum('total_feedback'),
                        'unique_users' => $feedbackStats->sum('unique_users'),
                        'by_issue_type' => $feedbackStats,
                        'by_status' => [
                            'new' => $feedbackStats->sum('new_feedback'),
                            'in_progress' => $feedbackStats->sum('in_progress'),
                            'resolved' => $feedbackStats->sum('resolved')
                        ]
                    ],
                    'academic_performance' => [
                        'total_exams' => $academicStats->total_exams ?? 0,
                        'student_count' => $academicStats->student_count ?? 0,
                        'average_score' => round($academicStats->avg_score ?? 0, 2),
                        'pass_rate' => $academicStats->total_exams > 0
                            ? round($academicStats->passed / $academicStats->total_exams, 4)
                            : 0
                    ]
                ]
            ], 200);
            
        } catch (\Exception $e) {
            Log::error('Get program analytics error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error retrieving program analytics',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get faculty-specific analytics for Faculty members.
     * 
     * Returns only subjects assigned to that faculty.
     * Only accessible by Faculty (2).
     * 
     * @param int $facultyId Faculty ID to check authorization
     * @return \Illuminate\Http\JsonResponse JSON response with faculty data
     */
    public function getFacultyAnalytics(Request $request, $facultyId)
    {
        try {
            $user = Auth::user();
            
            // Check role authorization and faculty ID match
            if ($user->roleID !== 2 || $user->userID != $facultyId) {
                return response()->json([
                    'message' => 'Unauthorized. This endpoint is only for faculty members.',
                    'error' => 'Insufficient permissions or wrong faculty ID'
                ], 403);
            }
            
            // Get faculty details
            $faculty = DB::table('users')
                ->where('userID', $facultyId)
                ->where('roleID', 2)
                ->first();
            
            if (!$faculty) {
                return response()->json([
                    'message' => 'Faculty not found',
                    'error' => 'Invalid faculty ID'
                ], 404);
            }
            
            // Get subjects assigned to this faculty
            $assignedSubjects = DB::table('faculty_subject_assignments')
                ->join('subjects', 'faculty_subject_assignments.subjectID', '=', 'subjects.subjectID')
                ->where('faculty_subject_assignments.facultyID', $facultyId)
                ->select('subjects.subjectID', 'subjects.subjectName', 'subjects.subjectCode')
                ->orderBy('subjects.subjectName')
                ->get();
            
            $subjectIds = $assignedSubjects->pluck('subjectID')->toArray();
            
            // Get students in faculty's subjects
            $students = DB::table('practice_exam_results')
                ->join('users', 'practice_exam_results.userID', '=', 'users.userID')
                ->join('subjects', 'practice_exam_results.subjectID', '=', 'subjects.subjectID')
                ->whereIn('practice_exam_results.subjectID', $subjectIds)
                ->where('users.campusID', $user->campusID)
                ->where('users.programID', $user->programID)
                ->distinct('users.userID')
                ->select('users.userID', 'users.name', 'users.email', 'users.yearLevel', 'users.programID')
                ->orderBy('users.yearLevel')
                ->orderBy('users.name')
                ->get();
            
            // Get performance data for each subject
            $subjectPerformance = DB::table('practice_exam_results')
                ->join('users', 'practice_exam_results.userID', '=', 'users.userID')
                ->whereIn('practice_exam_results.subjectID', $subjectIds)
                ->where('users.campusID', $user->campusID)
                ->where('users.programID', $user->programID)
                ->select(
                    'practice_exam_results.subjectID',
                    DB::raw('COUNT(*) as total_exams'),
                    DB::raw('COUNT(DISTINCT practice_exam_results.userID) as student_count'),
                    DB::raw('AVG(practice_exam_results.percentage) as avg_score'),
                    DB::raw('COUNT(CASE WHEN practice_exam_results.percentage >= 60 THEN 1 END) as passed'),
                    DB::raw('COUNT(CASE WHEN practice_exam_results.percentage < 60 THEN 1 END) as failed')
                )
                ->groupBy('practice_exam_results.subjectID')
                ->get();
            
            // Get feedback from faculty's students
            $feedbackStats = DB::table('user_feedback')
                ->join('users', 'user_feedback.user_id', '=', 'users.userID')
                ->whereIn('users.userID', $students->pluck('userID'))
                ->select(
                    DB::raw('COUNT(*) as total_feedback'),
                    DB::raw('COUNT(DISTINCT user_feedback.user_id) as unique_users'),
                    'issue_type',
                    DB::raw('COUNT(CASE WHEN status = "New" THEN 1 END) as new_feedback'),
                    DB::raw('COUNT(CASE WHEN status = "In Progress" THEN 1 END) as in_progress'),
                    DB::raw('COUNT(CASE WHEN status = "Resolved" THEN 1 END) as resolved')
                )
                ->groupBy('issue_type')
                ->get();
            
            return response()->json([
                'message' => 'Faculty analytics retrieved successfully',
                'data' => [
                    'faculty' => [
                        'user_id' => $faculty->userID,
                        'name' => $faculty->name,
                        'email' => $faculty->email,
                        'campus_id' => $faculty->campusID,
                        'program_id' => $faculty->programID
                    ],
                    'assigned_subjects' => $assignedSubjects,
                    'students' => [
                        'total_count' => $students->count(),
                        'by_year_level' => $students->groupBy('yearLevel')->map(function($yearStudents, $yearLevel) {
                            return [
                                'year_level' => $yearLevel,
                                'student_count' => $yearStudents->count(),
                                'students' => $yearStudents->map(function($student) {
                                    return [
                                        'user_id' => $student->userID,
                                        'name' => $student->name,
                                        'email' => $student->email,
                                        'program_id' => $student->programID
                                    ];
                                })
                            ];
                        })
                    ],
                    'subject_performance' => $subjectPerformance->map(function($performance) use ($assignedSubjects) {
                        $subject = $assignedSubjects->where('subjectID', $performance->subjectID)->first();
                        return [
                            'subject_id' => $performance->subjectID,
                            'subject_name' => $subject->subjectName ?? 'Unknown',
                            'subject_code' => $subject->subjectCode ?? 'Unknown',
                            'total_exams' => $performance->total_exams,
                            'student_count' => $performance->student_count,
                            'average_score' => round($performance->avg_score, 2),
                            'pass_rate' => $performance->total_exams > 0
                                ? round($performance->passed / $performance->total_exams, 4)
                                : 0
                        ];
                    }),
                    'feedback' => [
                        'total_feedback' => $feedbackStats->sum('total_feedback'),
                        'unique_users' => $feedbackStats->sum('unique_users'),
                        'by_issue_type' => $feedbackStats,
                        'by_status' => [
                            'new' => $feedbackStats->sum('new_feedback'),
                            'in_progress' => $feedbackStats->sum('in_progress'),
                            'resolved' => $feedbackStats->sum('resolved')
                        ]
                    ]
                ]
            ], 200);
            
        } catch (\Exception $e) {
            Log::error('Get faculty analytics error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error retrieving faculty analytics',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get average scores per student for the enhancement screen.
     * 
     * Returns { userID, average_score } for all students who have taken exams.
     * Used by the frontend to merge score data into the student list.
     * 
     * @return \Illuminate\Http\JsonResponse JSON response with per-student averages
     */
    public function getStudentScores(Request $request)
    {
        try {
            $user = Auth::user();
            
            $results = DB::table('practice_exam_results')
                ->join('users', 'practice_exam_results.userID', '=', 'users.userID')
                ->when(true, fn ($query) => $this->applyRoleBasedScope($query, $user))
                ->select(
                    'users.userID',
                    DB::raw('AVG(practice_exam_results.percentage) as average_score')
                )
                ->groupBy('users.userID')
                ->get();
            
            return response()->json([
                'message' => 'Student scores retrieved successfully',
                'data' => $results
            ], 200);
            
        } catch (\Exception $e) {
            Log::error('Student scores error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error retrieving student scores',
                'error' => $e->getMessage()
            ], 500);
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
    private function applyRoleBasedScope($query, $user, string $userTable = 'users')
    {
        $query->where("{$userTable}.isActive", true);

        switch ($user->roleID) {
            case 4: // Dean - all campus data
            case 5: // Associate Dean - all campus data
                if ($user->campusID) {
                    $query->where("{$userTable}.campusID", $user->campusID);
                }
                break;
            case 3: // Program Chair - program data
                if ($user->campusID && $user->programID) {
                    $query->where("{$userTable}.campusID", $user->campusID)
                          ->where("{$userTable}.programID", $user->programID);
                }
                break;
            case 2: // Faculty - only their students
                if ($user->campusID && $user->programID) {
                    $query->where("{$userTable}.campusID", $user->campusID)
                          ->where("{$userTable}.programID", $user->programID);
                }
                break;
            default:
                // No access by default
                $query->whereRaw('1 = 0');
        }
        
        return $query;
    }
    
    public function getStudentSubjectScores(Request $request, $userId)
    {
        try {
            $practiceResults = DB::table('practice_exam_results')
                ->join('subjects', 'practice_exam_results.subjectID', '=', 'subjects.subjectID')
                ->where('practice_exam_results.userID', $userId)
                ->select(
                    'subjects.subjectID',
                    'subjects.subjectName',
                    DB::raw('COUNT(*) as attempt_count'),
                    DB::raw('AVG(practice_exam_results.percentage) as avg_score'),
                    DB::raw('MAX(practice_exam_results.percentage) as best_score'),
                    DB::raw('MIN(practice_exam_results.percentage) as lowest_score')
                )
                ->groupBy('subjects.subjectID', 'subjects.subjectName')
                ->orderByDesc('avg_score')
                ->get();

            $quizResults = DB::table('student_quiz_results')
                ->join('class_personal_quizzes', 'student_quiz_results.class_quiz_assignment_id', '=', 'class_personal_quizzes.classPersonalQuizID')
                ->join('personal_quizzes', 'class_personal_quizzes.personalQuizID', '=', 'personal_quizzes.personalQuizID')
                ->where('student_quiz_results.studentID', $userId)
                ->select(
                    'personal_quizzes.personalQuizID as subjectID',
                    'personal_quizzes.title as subjectName',
                    DB::raw('COUNT(*) as attempt_count'),
                    DB::raw('AVG(student_quiz_results.percentage) as avg_score'),
                    DB::raw('MAX(student_quiz_results.percentage) as best_score')
                )
                ->groupBy('personal_quizzes.personalQuizID', 'personal_quizzes.title')
                ->get();

            return response()->json([
                'message' => 'Student subject scores retrieved',
                'data' => [
                    'practice' => $practiceResults,
                    'quiz'     => $quizResults,
                ]
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error retrieving student subject scores',
                'error'   => $e->getMessage()
            ], 500);
        }
    }
}
