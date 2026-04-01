<?php

namespace Modules\Analytics\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Modules\Analytics\Models\ExamAttempt;
use Modules\Analytics\Models\ExamResult;
use Modules\Analytics\Models\ExamAnalytics;
use Modules\Analytics\Models\ExamTopicAnalytics;
use Modules\Analytics\Models\ExamDifficultyAnalytics;
use Modules\Analytics\Models\ExamRecommendation;
use Modules\Analytics\Models\LessonView;
use Modules\Analytics\Models\QuestionStatsDaily;
use App\Services\LeaderboardService;
use Modules\Users\Services\EmailNotificationService;
use Carbon\Carbon;


class AnalyticsController extends Controller
{
    // ── SPRINT 1 ──────────────────────────────────────────────────────────────

    /**
     * Compute and return overall score, topic scores, difficulty breakdown.
     * POST /api/analytics/score/{attemptId}
     */
    public function computeScore(int $attemptId)
    {
        try {
            $attempt = ExamAttempt::findOrFail($attemptId);

            // ── Overall Score ─────────────────────────────────────────────────
            $total   = ExamResult::where('attempt_id', $attemptId)->count();
            $correct = ExamResult::where('attempt_id', $attemptId)
                                 ->where('is_correct', true)->count();

            $overallScore = $total > 0 ? round(($correct / $total) * 100, 2) : 0;

            // Calculate improvement vs first attempt
            $firstAttempt = ExamAnalytics::where('user_id', $attempt->user_id)
                ->whereHas('attempt', fn($q) => $q->where('exam_id', $attempt->exam_id))
                ->orderBy('created_at', 'asc')
                ->first();

            $improvementPct = null;
            if ($firstAttempt && $firstAttempt->attempt_id !== $attemptId) {
                $first = $firstAttempt->overall_score;
                if ($first > 0) {
                    $improvementPct = round((($overallScore - $first) / $first) * 100, 2);
                }
            }

            $analytics = ExamAnalytics::updateOrCreate(
                ['attempt_id' => $attemptId],
                [
                    'user_id'         => $attempt->user_id,
                    'overall_score'   => $overallScore,
                    'improvement_pct' => $improvementPct,
                ]
            );

            // ── Topic Scores ──────────────────────────────────────────────────
            $topics  = ExamResult::where('attempt_id', $attemptId)
                                 ->select('topic_id', 'subject_id')
                                 ->distinct()->get();

            $hasWeak = false;

            foreach ($topics as $t) {
                $topicTotal   = ExamResult::where('attempt_id', $attemptId)
                                          ->where('topic_id', $t->topic_id)->count();
                $topicCorrect = ExamResult::where('attempt_id', $attemptId)
                                          ->where('topic_id', $t->topic_id)
                                          ->where('is_correct', true)->count();

                $scorePct = $topicTotal > 0
                    ? round(($topicCorrect / $topicTotal) * 100, 2)
                    : 0;
                $isWeak   = $scorePct < 60;

                if ($isWeak) $hasWeak = true;

                ExamTopicAnalytics::updateOrCreate(
                    ['attempt_id' => $attemptId, 'topic_id' => $t->topic_id],
                    [
                        'user_id'    => $attempt->user_id,
                        'subject_id' => $t->subject_id,
                        'correct'    => $topicCorrect,
                        'total'      => $topicTotal,
                        'score_pct'  => $scorePct,
                        'is_weak'    => $isWeak,
                    ]
                );
            }

            ExamAnalytics::where('attempt_id', $attemptId)
                         ->update(['has_weak_topics' => $hasWeak]);

            // ── Difficulty Scores ─────────────────────────────────────────────
            $difficulties = ['easy', 'moderate', 'hard'];

            foreach ($difficulties as $diff) {
                $diffTotal   = ExamResult::where('attempt_id', $attemptId)
                                         ->where('difficulty', $diff)->count();
                $diffCorrect = ExamResult::where('attempt_id', $attemptId)
                                         ->where('difficulty', $diff)
                                         ->where('is_correct', true)->count();

                $diffScore = $diffTotal > 0
                    ? round(($diffCorrect / $diffTotal) * 100, 2)
                    : 0;

                ExamDifficultyAnalytics::updateOrCreate(
                    ['attempt_id' => $attemptId, 'difficulty' => $diff],
                    [
                        'user_id'   => $attempt->user_id,
                        'correct'   => $diffCorrect,
                        'total'     => $diffTotal,
                        'score_pct' => $diffScore,
                    ]
                );
            }

            // ── Leaderboard Push (Real-Time) ──────────────────────────────────
            try {
                $leaderboard = app(LeaderboardService::class);
                $finishedAt = Carbon::now();
                $composite = $leaderboard->computeComposite($overallScore, $finishedAt);

                // 1. Global Leaderboard
                $leaderboard->updateScoreConditionally($leaderboard->buildKey('global'), $composite, $attempt->user_id);

                // 2. Per-Exam Leaderboard
                $leaderboard->updateScoreConditionally($leaderboard->buildKey('exam', $attempt->exam_id), $composite, $attempt->user_id);

                // 3. Per-Class Leaderboard (for each class the student is in)
                $classes = DB::table('class_enrollments')
                    ->where('studentID', $attempt->user_id)
                    ->pluck('classID');

                foreach ($classes as $classId) {
                    $leaderboard->updateScoreConditionally($leaderboard->buildKey('class', $classId), $composite, $attempt->user_id);
                }
            } catch (\Exception $e) {
                // We log but don't fail the request if Redis is down
                Log::warning('Leaderboard push failed in computeScore: ' . $e->getMessage());
            }

            // ── Send Email Notification (Point 2 in Enhancement Plan) ─────────
            try {
                $userModel = \Modules\Users\Models\User::find($attempt->user_id);
                if ($userModel) {
                    $emailService = app(EmailNotificationService::class);
                    $emailService->sendExamCompletionNotification($userModel, $overallScore);
                }
            } catch (\Exception $e) {
                Log::warning('Exam completion email failed: ' . $e->getMessage());
            }

            // ── Return All ────────────────────────────────────────────────────
            return response()->json([
                'overall'    => ExamAnalytics::where('attempt_id', $attemptId)->first(),
                'topics'     => ExamTopicAnalytics::where('attempt_id', $attemptId)->get(),
                'difficulty' => ExamDifficultyAnalytics::where('attempt_id', $attemptId)->get(),
            ]);

        } catch (\Exception $e) {
            Log::error('computeScore failed: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    // ── SPRINT 2 ──────────────────────────────────────────────────────────────

    /**
     * Get weak topics for a student.
     * GET /api/analytics/weak-topics/{userId}
     */
    public function getWeakTopics(int $userId)
    {
        try {
            $weakTopics = ExamTopicAnalytics::where('user_id', $userId)
                ->where('is_weak', true)
                ->orderBy('score_pct', 'asc')
                ->get();

            return response()->json(['weak_topics' => $weakTopics]);

        } catch (\Exception $e) {
            Log::error('getWeakTopics failed: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Generate and return recommendations for an attempt.
     * GET /api/analytics/recommendations/{attemptId}
     */
    public function getRecommendations(int $attemptId)
    {
        try {
            $attempt = ExamAttempt::findOrFail($attemptId);

            // Delete old recommendations for this attempt
            ExamRecommendation::where('attempt_id', $attemptId)->delete();

            $recs = [];

            // Topic-based recommendations
            $weakTopics = ExamTopicAnalytics::where('attempt_id', $attemptId)
                ->where('is_weak', true)->get();

            foreach ($weakTopics as $wt) {
                $recs[] = [
                    'attempt_id'     => $attemptId,
                    'user_id'        => $attempt->user_id,
                    'recommendation' => 'Practice more in Topic ID ' . $wt->topic_id . '.',
                    'type'           => 'topic',
                    'created_at'     => now(),
                    'updated_at'     => now(),
                ];
            }

            // Difficulty-based recommendations
            $diffScores = ExamDifficultyAnalytics::where('attempt_id', $attemptId)
                ->get()->keyBy('difficulty');

            if (isset($diffScores['moderate']) && $diffScores['moderate']->score_pct < 50) {
                $recs[] = [
                    'attempt_id'     => $attemptId,
                    'user_id'        => $attempt->user_id,
                    'recommendation' => 'Review Moderate level questions.',
                    'type'           => 'difficulty',
                    'created_at'     => now(),
                    'updated_at'     => now(),
                ];
            }

            if (isset($diffScores['hard']) && $diffScores['hard']->score_pct < 40) {
                $recs[] = [
                    'attempt_id'     => $attemptId,
                    'user_id'        => $attempt->user_id,
                    'recommendation' => 'Focus on Hard level problems.',
                    'type'           => 'difficulty',
                    'created_at'     => now(),
                    'updated_at'     => now(),
                ];
            }

            // General recommendation
            $overall = ExamAnalytics::where('attempt_id', $attemptId)->first();
            if ($overall && $overall->overall_score < 60) {
                $recs[] = [
                    'attempt_id'     => $attemptId,
                    'user_id'        => $attempt->user_id,
                    'recommendation' => 'Review your overall performance and revisit all weak areas.',
                    'type'           => 'general',
                    'created_at'     => now(),
                    'updated_at'     => now(),
                ];
            }

            if (!empty($recs)) {
                ExamRecommendation::insert($recs);
            }

            return response()->json([
                'recommendations' => ExamRecommendation::where('attempt_id', $attemptId)->get()
            ]);

        } catch (\Exception $e) {
            Log::error('getRecommendations failed: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Compute and return rank and percentile.
     * GET /api/analytics/rank/{examId}/{userId}
     */
    public function getRank(int $examId, int $userId)
    {
        try {
            $scores = ExamAnalytics::select('exam_analytics.*')
                ->join('exam_attempts', 'exam_analytics.attempt_id', '=', 'exam_attempts.id')
                ->where('exam_attempts.exam_id', $examId)
                ->where('exam_attempts.status', 'completed')
                ->orderByDesc('exam_analytics.overall_score')
                ->get();

            $total = $scores->count();

            foreach ($scores as $index => $row) {
                $position   = $index + 1;
                $below      = $total - $position;
                $percentile = $total > 0 ? round(($below / $total) * 100, 2) : 0;

                ExamAnalytics::where('attempt_id', $row->attempt_id)->update([
                    'rank'             => $position,
                    'total_candidates' => $total,
                    'percentile'       => $percentile,
                ]);
            }

            $myRecord = ExamAnalytics::where('user_id', $userId)
                ->whereHas('attempt', fn($q) => $q->where('exam_id', $examId))
                ->first();

            return response()->json([
                'rank'             => $myRecord?->rank,
                'total_candidates' => $total,
                'percentile'       => $myRecord?->percentile,
            ]);

        } catch (\Exception $e) {
            Log::error('getRank failed: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    // ── SPRINT 3 ──────────────────────────────────────────────────────────────

    /**
     * Get most viewed lessons for a course.
     * GET /api/analytics/content/lessons/{courseId}
     */
    public function getMostViewedLessons(int $courseId)
    {
        try {
            $lessons = LessonView::where('course_id', $courseId)
                ->select('lesson_id', DB::raw('COUNT(*) as view_count'))
                ->groupBy('lesson_id')
                ->orderByDesc('view_count')
                ->limit(10)
                ->get();

            return response()->json(['lessons' => $lessons]);

        } catch (\Exception $e) {
            Log::error('getMostViewedLessons failed: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Get most attempted and highest error rate questions.
     * GET /api/analytics/content/questions/{examId}
     */
    public function getQuestionStats(int $examId)
    {
        try {
            $mostAttempted = QuestionStatsDaily::select(
                    'question_id',
                    DB::raw('SUM(total_attempts) as attempts'))
                ->groupBy('question_id')
                ->orderByDesc('attempts')
                ->limit(10)
                ->get();

            $highestError = QuestionStatsDaily::select(
                    'question_id',
                    DB::raw('SUM(total_incorrect) as total_wrong'),
                    DB::raw('SUM(total_attempts) as total_tries'),
                    DB::raw('ROUND(SUM(total_incorrect) / NULLIF(SUM(total_attempts),0), 4) as error_rate'))
                ->groupBy('question_id')
                ->orderByDesc('error_rate')
                ->limit(10)
                ->get();

            return response()->json([
                'most_attempted' => $mostAttempted,
                'highest_error'  => $highestError,
            ]);

        } catch (\Exception $e) {
            Log::error('getQuestionStats failed: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Get most skipped topics.
     * GET /api/analytics/content/skipped/{courseId}
     */
    public function getMostSkippedTopics(int $courseId)
    {
        try {
            $skipped = QuestionStatsDaily::select(
                    'topic_id',
                    DB::raw('SUM(total_skipped) as skipped_count'))
                ->groupBy('topic_id')
                ->orderByDesc('skipped_count')
                ->limit(10)
                ->get();

            return response()->json(['skipped_topics' => $skipped]);

        } catch (\Exception $e) {
            Log::error('getMostSkippedTopics failed: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Get practice exam content analytics for the frontend.
     * GET /api/practice-exam/content-analytics
     */
    public function getPracticeContentAnalytics()
    {
        try {
            $totalViews = LessonView::count();
            $totalAttempts = QuestionStatsDaily::sum('total_attempts');
            $totalSkipped = QuestionStatsDaily::sum('total_skipped');
            $avgErrorRate = QuestionStatsDaily::selectRaw('CASE WHEN SUM(total_attempts) = 0 THEN 0 ELSE SUM(total_incorrect) / SUM(total_attempts) END as rate')
                ->value('rate');

            $mostViewed = LessonView::select('lesson_id', DB::raw('COUNT(*) as views'))
                ->groupBy('lesson_id')
                ->orderByDesc('views')
                ->limit(10)
                ->get()
                ->map(fn($item) => [
                    'lessonId' => $item->lesson_id,
                    'lessonName' => "Lesson #{$item->lesson_id}",
                    'views' => (int) $item->views,
                ]);

            $mostAttempted = QuestionStatsDaily::select(
                    'question_stats_daily.question_id',
                    DB::raw('SUM(total_attempts) as count'),
                    'questions.questionText'
                )
                ->join('questions', 'question_stats_daily.question_id', '=', 'questions.questionID')
                ->groupBy('question_stats_daily.question_id', 'questions.questionText')
                ->orderByDesc('count')
                ->limit(10)
                ->get()
                ->map(fn($item) => [
                    'questionId' => $item->question_id,
                    'questionText' => $item->questionText,
                    'count' => (int) $item->count,
                ]);

            $highestError = QuestionStatsDaily::select(
                    'question_stats_daily.question_id',
                    DB::raw('SUM(total_incorrect) as total_wrong'),
                    DB::raw('SUM(total_attempts) as total_tries'),
                    DB::raw('ROUND(SUM(total_incorrect) / NULLIF(SUM(total_attempts), 0), 4) as rate'),
                    'questions.questionText'
                )
                ->join('questions', 'question_stats_daily.question_id', '=', 'questions.questionID')
                ->groupBy('question_stats_daily.question_id', 'questions.questionText')
                ->orderByDesc('rate')
                ->limit(10)
                ->get()
                ->map(fn($item) => [
                    'questionId' => $item->question_id,
                    'questionText' => $item->questionText,
                    'rate' => (float) $item->rate,
                    'totalWrong' => (int) $item->total_wrong,
                    'totalTries' => (int) $item->total_tries,
                ]);

            $mostSkipped = QuestionStatsDaily::select(
                    'question_stats_daily.topic_id',
                    DB::raw('SUM(total_skipped) as skipped_count'),
                    'coverages.name as topicName'
                )
                ->join('coverages', 'question_stats_daily.topic_id', '=', 'coverages.id')
                ->groupBy('question_stats_daily.topic_id', 'coverages.name')
                ->orderByDesc('skipped_count')
                ->limit(10)
                ->get()
                ->map(fn($item) => [
                    'topicId' => $item->topic_id,
                    'name' => $item->topicName,
                    'skipped_count' => (int) $item->skipped_count,
                ]);

            return response()->json([
                'totalViews' => $totalViews,
                'totalAttempts' => $totalAttempts,
                'avgErrorRate' => round($avgErrorRate * 100, 2),
                'totalSkipped' => $totalSkipped,
                'mostViewed' => $mostViewed,
                'mostAttempted' => $mostAttempted,
                'highestError' => $highestError,
                'mostSkipped' => $mostSkipped,
            ]);
        } catch (\Exception $e) {
            Log::error('getPracticeContentAnalytics failed: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Get aggregated difficulty analytics for the frontend.
     * GET /api/practice-exam/difficulty-analytics
     */
    public function getPracticeDifficultyAnalytics()
    {
        try {
            $difficultyBands = ExamResult::selectRaw(
                    'difficulty, COUNT(*) as total, SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct'
                )
                ->groupBy('difficulty')
                ->get()
                ->map(fn($item) => [
                    'level' => ucfirst($item->difficulty),
                    'score' => $item->total > 0 ? round(($item->correct / $item->total) * 100, 2) : 0,
                    'total' => (int) $item->total,
                    'correct' => (int) $item->correct,
                ]);

            $topicBreakdown = ExamResult::selectRaw(
                    'exam_results.topic_id, coverages.name as topicName, '
                    . 'SUM(CASE WHEN difficulty = "easy" THEN 1 ELSE 0 END) as easy_total, '
                    . 'SUM(CASE WHEN difficulty = "easy" AND is_correct = 1 THEN 1 ELSE 0 END) as easy_correct, '
                    . 'SUM(CASE WHEN difficulty = "moderate" THEN 1 ELSE 0 END) as moderate_total, '
                    . 'SUM(CASE WHEN difficulty = "moderate" AND is_correct = 1 THEN 1 ELSE 0 END) as moderate_correct, '
                    . 'SUM(CASE WHEN difficulty = "hard" THEN 1 ELSE 0 END) as hard_total, '
                    . 'SUM(CASE WHEN difficulty = "hard" AND is_correct = 1 THEN 1 ELSE 0 END) as hard_correct, '
                    . 'COUNT(*) as total_questions, '
                    . 'SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as total_correct'
                )
                ->join('coverages', 'exam_results.topic_id', '=', 'coverages.id')
                ->groupBy('exam_results.topic_id', 'coverages.name')
                ->orderByDesc('total_questions')
                ->limit(10)
                ->get()
                ->map(fn($item) => [
                    'topicId' => $item->topic_id,
                    'topicName' => $item->topicName,
                    'easyScore' => $item->easy_total > 0 ? round(($item->easy_correct / $item->easy_total) * 100, 2) : 0,
                    'moderateScore' => $item->moderate_total > 0 ? round(($item->moderate_correct / $item->moderate_total) * 100, 2) : 0,
                    'hardScore' => $item->hard_total > 0 ? round(($item->hard_correct / $item->hard_total) * 100, 2) : 0,
                    'overallScore' => $item->total_questions > 0 ? round(($item->total_correct / $item->total_questions) * 100, 2) : 0,
                    'avgAttempts' => 0,
                ]);

            return response()->json([
                'difficultyBands' => $difficultyBands,
                'topicBreakdown' => $topicBreakdown,
            ]);
        } catch (\Exception $e) {
            Log::error('getPracticeDifficultyAnalytics failed: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Get difficulty analytics for a topic.
     * GET /api/analytics/difficulty/{topicId}
     */
    public function getDifficultyAnalytics(int $topicId)
    {
        try {
            $stats = ExamResult::where('topic_id', $topicId)
                ->selectRaw('
                    COUNT(*) as total,
                    SUM(CASE WHEN is_correct = 0 AND is_skipped = 0 THEN 1 ELSE 0 END) as wrong,
                    AVG(time_spent) as avg_time
                ')
                ->first();

            $total   = $stats->total ?? 0;
            $wrong   = $stats->wrong ?? 0;
            $avgTime = round($stats->avg_time ?? 0);

            $difficultyIndex = $total > 0 ? round($wrong / $total, 4) : 0.0;

            $difficultyLabel = match(true) {
                $difficultyIndex <= 0.33 => 'easy',
                $difficultyIndex <= 0.66 => 'moderate',
                default                  => 'hard',
            };

            // Average attempts before passing
            $passingUsers = ExamTopicAnalytics::where('topic_id', $topicId)
                ->select('user_id', DB::raw('MIN(attempt_id) as first_pass_attempt'))
                ->where('score_pct', '>=', 60)
                ->groupBy('user_id')
                ->get();

            $attemptsBeforePassList = [];
            foreach ($passingUsers as $row) {
                $count = ExamTopicAnalytics::where('user_id', $row->user_id)
                    ->where('topic_id', $topicId)
                    ->where('attempt_id', '<=', $row->first_pass_attempt)
                    ->count();
                $attemptsBeforePassList[] = $count;
            }

            $avgBeforePass = count($attemptsBeforePassList) > 0
                ? round(array_sum($attemptsBeforePassList) / count($attemptsBeforePassList), 2)
                : null;

            return response()->json([
                'topic_id'             => $topicId,
                'total_answers'        => $total,
                'wrong_answers'        => $wrong,
                'error_rate'           => $total > 0 ? round($wrong / $total, 4) : 0,
                'avg_time_seconds'     => $avgTime,
                'difficulty_index'     => $difficultyIndex,
                'difficulty_label'     => $difficultyLabel,
                'avg_attempts_to_pass' => $avgBeforePass,
            ]);

        } catch (\Exception $e) {
            Log::error('getDifficultyAnalytics failed: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Get progress over time and improvement percentage.
     * GET /api/analytics/progress/{userId}/{subjectId}
     */
            public function getProgress(int $userId, int $subjectId)
        {
            try {
                $history = ExamAnalytics::select(
                        'exam_analytics.overall_score',
                        'exam_analytics.attempt_id',
                        'exam_analytics.created_at'
                    )
                    ->join('exam_attempts', 'exam_analytics.attempt_id', '=', 'exam_attempts.id')
                    ->where('exam_analytics.user_id', $userId)
                    ->where('exam_attempts.status', 'completed')
                    ->whereExists(function ($query) use ($subjectId) {
                        $query->select('id')
                            ->from('exam_topic_analytics')
                            ->whereColumn('exam_topic_analytics.attempt_id', 'exam_analytics.attempt_id')
                            ->where('exam_topic_analytics.subject_id', $subjectId);
                    })
                    ->orderBy('exam_analytics.created_at', 'asc')
                    ->get();

                if ($history->isEmpty()) {
                    return response()->json([
                        'history'          => [],
                        'improvement_pct'  => null
                    ]);
                }

                $firstScore  = $history->first()->overall_score;
                $latestScore = $history->last()->overall_score;

                $improvementPct = $firstScore > 0
                    ? round((($latestScore - $firstScore) / $firstScore) * 100, 2)
                    : null;

                return response()->json([
                    'history' => $history->map(fn($h) => [
                        'attempt_id' => $h->attempt_id,
                        'score'      => $h->overall_score,
                        'date'       => $h->created_at->toDateString(),
                    ]),
                    'first_score'      => $firstScore,
                    'latest_score'     => $latestScore,
                    'improvement_pct'  => $improvementPct,
                ]);

            } catch (\Exception $e) {
                Log::error('getProgress failed: ' . $e->getMessage());
                return response()->json(['error' => $e->getMessage()], 500);
            }
        }
    /**
     * Get faculty / program chair class summary.
     * GET /api/analytics/faculty/summary/{classId}
     */
        public function getFacultySummary(int $classId)
    {
        try {
            $topicAverages = ExamTopicAnalytics::select(
                    'topic_id',
                    DB::raw('ROUND(AVG(score_pct), 2) as avg_score'),
                    DB::raw('SUM(CASE WHEN is_weak=1 THEN 1 ELSE 0 END) as weak_count'),
                    DB::raw('COUNT(DISTINCT user_id) as student_count')
                )
                ->groupBy('topic_id')
                ->orderBy('avg_score', 'asc')
                ->get();

            $weakTopics = ExamTopicAnalytics::select(
                    'topic_id',
                    DB::raw('COUNT(*) as weak_count')
                )
                ->where('is_weak', true)
                ->groupBy('topic_id')
                ->orderByDesc('weak_count')
                ->limit(10)
                ->get();

            $difficultyAvg = ExamDifficultyAnalytics::select(
                    'difficulty',
                    DB::raw('ROUND(AVG(score_pct), 2) as avg_score')
                )
                ->groupBy('difficulty')
                ->get();

            return response()->json([
                'class_id'       => $classId,
                'topic_averages' => $topicAverages,
                'weak_topics'    => $weakTopics,
                'difficulty_avg' => $difficultyAvg,
            ]);

        } catch (\Exception $e) {
            Log::error('getFacultySummary failed: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Log a lesson view event.
     * POST /api/analytics/lesson-view
     */
    public function logLessonView(Request $request)
    {
        try {
            $data = $request->validate([
                'lesson_id'  => 'required|integer',
                'course_id'  => 'required|integer',
                'subject_id' => 'required|integer',
            ]);

            LessonView::create([
                'user_id'    => Auth::id(),
                'lesson_id'  => $data['lesson_id'],
                'course_id'  => $data['course_id'],
                'subject_id' => $data['subject_id'],
            ]);

            return response()->json(['message' => 'Lesson view recorded.'], 201);

        } catch (\Exception $e) {
            Log::error('logLessonView failed: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
        /**
     * GET /api/analytics/subject-score/{userId}/{subjectId}
     * Returns per-subject and per-topic score breakdown for a user.
     */
    public function getSubjectScore(int $userId, int $subjectId)
    {
        try {
            // Per-topic scores for this subject
            $topicScores = ExamTopicAnalytics::where('user_id', $userId)
                ->where('subject_id', $subjectId)
                ->select(
                    'topic_id',
                    'subject_id',
                    DB::raw('ROUND(AVG(score_pct), 2) as avg_score'),
                    DB::raw('SUM(correct) as total_correct'),
                    DB::raw('SUM(total) as total_questions'),
                    DB::raw('MAX(score_pct) as best_score'),
                    DB::raw('MIN(score_pct) as lowest_score'),
                    DB::raw('SUM(CASE WHEN is_weak = 1 THEN 1 ELSE 0 END) as weak_count'),
                    DB::raw('COUNT(*) as attempt_count')
                )
                ->groupBy('topic_id', 'subject_id')
                ->orderBy('avg_score', 'asc')
                ->get();

            // Overall subject score (average of all topics in this subject)
            $subjectScore = $topicScores->avg('avg_score');

            // Count weak vs strong topics
            $weakTopics   = $topicScores->where('avg_score', '<', 60)->count();
            $strongTopics = $topicScores->where('avg_score', '>=', 60)->count();

            return response()->json([
                'user_id'        => $userId,
                'subject_id'     => $subjectId,
                'subject_score'  => round($subjectScore ?? 0, 2),
                'total_topics'   => $topicScores->count(),
                'weak_topics'    => $weakTopics,
                'strong_topics'  => $strongTopics,
                'topic_scores'   => $topicScores,
            ]);

        } catch (\Exception $e) {
            Log::error('getSubjectScore failed: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
            /**
         * GET /api/analytics/student-summary/{userId}/{attemptId}
         * Returns all analytics in one call — overall score, topics,
         * difficulty, rank, recommendations, and progress.
         */
        public function getStudentSummary(int $userId, int $attemptId)
        {
            try {
                $attempt = ExamAttempt::findOrFail($attemptId);

                // 1. Overall score
                $overall = ExamAnalytics::where('attempt_id', $attemptId)
                    ->where('user_id', $userId)
                    ->first();

                // 2. Topic scores
                $topicScores = ExamTopicAnalytics::where('attempt_id', $attemptId)
                    ->where('user_id', $userId)
                    ->get();

                // 3. Difficulty breakdown
                $difficultyScores = ExamDifficultyAnalytics::where('attempt_id', $attemptId)
                    ->where('user_id', $userId)
                    ->get();

                // 4. Weak topics (all time, not just this attempt)
                $weakTopics = ExamTopicAnalytics::where('user_id', $userId)
                    ->where('is_weak', true)
                    ->orderBy('score_pct', 'asc')
                    ->get();

                // 5. Recommendations
                $recommendations = ExamRecommendation::where('attempt_id', $attemptId)
                    ->where('user_id', $userId)
                    ->get();

                // 6. Rank & percentile
                $rank = ExamAnalytics::where('user_id', $userId)
                    ->whereHas('attempt', fn($q) => $q->where('exam_id', $attempt->exam_id))
                    ->first();

                // 7. Subject score breakdown
                $subjectScores = ExamTopicAnalytics::where('user_id', $userId)
                    ->where('attempt_id', $attemptId)
                    ->select(
                        'subject_id',
                        DB::raw('ROUND(AVG(score_pct), 2) as subject_score'),
                        DB::raw('SUM(correct) as total_correct'),
                        DB::raw('SUM(total) as total_questions'),
                        DB::raw('SUM(CASE WHEN is_weak = 1 THEN 1 ELSE 0 END) as weak_topics')
                    )
                    ->groupBy('subject_id')
                    ->get();

                // 8. Progress over time (same exam)
                $progress = ExamAnalytics::select(
                        'exam_analytics.overall_score',
                        'exam_analytics.attempt_id',
                        'exam_analytics.created_at'
                    )
                    ->join('exam_attempts', 'exam_analytics.attempt_id', '=', 'exam_attempts.id')
                    ->where('exam_analytics.user_id', $userId)
                    ->where('exam_attempts.exam_id', $attempt->exam_id)
                    ->where('exam_attempts.status', 'completed')
                    ->orderBy('exam_analytics.created_at', 'asc')
                    ->get()
                    ->map(fn($h) => [
                        'attempt_id' => $h->attempt_id,
                        'score'      => $h->overall_score,
                        'date'       => $h->created_at->toDateString(),
                    ]);

                return response()->json([
                    'user_id'          => $userId,
                    'attempt_id'       => $attemptId,
                    'exam_id'          => $attempt->exam_id,
                    'overall'          => $overall,
                    'subject_scores'   => $subjectScores,
                    'topic_scores'     => $topicScores,
                    'difficulty'       => $difficultyScores,
                    'weak_topics'      => $weakTopics,
                    'recommendations'  => $recommendations,
                    'rank'             => [
                        'rank'             => $rank?->rank,
                        'total_candidates' => $rank?->total_candidates,
                        'percentile'       => $rank?->percentile,
                    ],
                    'progress'         => $progress,
                    'improvement_pct'  => $overall?->improvement_pct,
                ]);

            } catch (\Exception $e) {
                Log::error('getStudentSummary failed: ' . $e->getMessage());
                return response()->json(['error' => $e->getMessage()], 500);
            }
        }

    /**
     * Update question stats after an answer is submitted.
     * POST /api/analytics/question-stats
     */
    public function updateQuestionStats(Request $request)
    {
        try {
            $data = $request->validate([
                'question_id' => 'required|integer',
                'topic_id'    => 'required|integer',
                'is_correct'  => 'required|boolean',
                'is_skipped'  => 'required|boolean',
            ]);

            $today = now()->toDateString();

            $row = QuestionStatsDaily::firstOrCreate(
                ['question_id' => $data['question_id'], 'stat_date' => $today],
                [
                    'topic_id'        => $data['topic_id'],
                    'total_attempts'  => 0,
                    'total_correct'   => 0,
                    'total_incorrect' => 0,
                    'total_skipped'   => 0,
                    'error_rate'      => 0,
                ]
            );

            if (!$data['is_skipped']) {
                $row->total_attempts++;
                if ($data['is_correct']) {
                    $row->total_correct++;
                } else {
                    $row->total_incorrect++;
                }
            } else {
                $row->total_skipped++;
            }

            $row->error_rate = $row->total_attempts > 0
                ? round($row->total_incorrect / $row->total_attempts, 4)
                : 0;

            $row->save();

            return response()->json(['message' => 'Question stats updated.'], 201);

        } catch (\Exception $e) {
            Log::error('updateQuestionStats failed: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}