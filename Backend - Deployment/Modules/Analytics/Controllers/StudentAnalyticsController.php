<?php

namespace Modules\Analytics\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Crypt;
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
            
            // Get weakest subject (lowest average score) using actual answers
            try {
                $weakestTopic = DB::table('practice_exam_answers')
                    ->join('questions', 'practice_exam_answers.question_id', '=', 'questions.questionID')
                    ->join('subjects', 'questions.subjectID', '=', 'subjects.subjectID')
                    ->where('practice_exam_answers.user_id', $user->userID)
                    ->select('subjects.subjectName as topic', DB::raw('(SUM(CASE WHEN practice_exam_answers.is_correct = 1 THEN 100 ELSE 0 END) / COUNT(*)) as avg_score'))
                    ->groupBy('subjects.subjectName')
                    ->orderBy('avg_score', 'asc')
                    ->first();
            } catch (\Exception $e) {
                // Table doesn't exist or no data
                $weakestTopic = null;
            }

            // Count frequently mistaken questions (3+ current consecutive wrong answers)
            try {
                $mistakeStats = $this->buildQuestionMistakeStats($user->userID);
                $frequentlyMistakenCount = $mistakeStats
                    ->filter(function ($item) {
                        return (int) ($item['consecutive_wrong_count'] ?? 0) >= 3;
                    })
                    ->count();
            } catch (\Exception $e) {
                $frequentlyMistakenCount = 0;
            }

            // Calculate average attempts before passing (per subject)
            try {
                $subjectAttempts = DB::table('practice_exam_results')
                    ->where('userID', $user->userID)
                    ->select('subjectID', DB::raw('COUNT(*) as attempts'), DB::raw('MAX(CASE WHEN percentage >= 75 THEN 1 ELSE 0 END) as passed'))
                    ->groupBy('subjectID')
                    ->get();

                $totalAttemptsForPassing = 0;
                $passedSubjectsCount = 0;
                foreach ($subjectAttempts as $sa) {
                    if ($sa->passed) {
                        // Count how many attempts it took to reach 75%
                        $attemptsUntilPass = DB::table('practice_exam_results')
                            ->where('userID', $user->userID)
                            ->where('subjectID', $sa->subjectID)
                            ->orderBy('created_at', 'asc')
                            ->select('percentage')
                            ->get();

                        $attemptsNeeded = 0;
                        foreach ($attemptsUntilPass as $attempt) {
                            $attemptsNeeded++;
                            if ($attempt->percentage >= 75) {
                                break;
                            }
                        }
                        $totalAttemptsForPassing += $attemptsNeeded;
                        $passedSubjectsCount++;
                    }
                }
                $avgAttemptsBeforePassing = $passedSubjectsCount > 0
                    ? round($totalAttemptsForPassing / $passedSubjectsCount, 2)
                    : 0;
            } catch (\Exception $e) {
                $avgAttemptsBeforePassing = 0;
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
                    'frequently_mistaken_questions_count' => $frequentlyMistakenCount,
                    'average_attempts_before_passing' => $avgAttemptsBeforePassing,
                    'weakest_topic' => [
                        'name' => $weakestTopic->topic ?? 'N/A',
                        'error_rate' => 1 - ($weakestTopic->avg_score ?? 0) / 100,
                    ],
                    'strongest_subject' => null, // Fetched via getInsights endpoint
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
            
            // Strong subjects (score >= 80%)
            try {
                $strongTopics = DB::table('practice_exam_answers')
                    ->join('questions', 'practice_exam_answers.question_id', '=', 'questions.questionID')
                    ->join('subjects', 'questions.subjectID', '=', 'subjects.subjectID')
                    ->where('practice_exam_answers.user_id', $user->userID)
                    ->select('subjects.subjectName as topic', DB::raw('(SUM(CASE WHEN practice_exam_answers.is_correct = 1 THEN 100 ELSE 0 END) / COUNT(*)) as avg_score'))
                    ->groupBy('subjects.subjectName')
                    ->having('avg_score', '>=', 80)
                    ->orderByDesc('avg_score')
                    ->limit(5)
                    ->get();
            } catch (\Exception $e) {
                $strongTopics = collect([]);
            }
            
            // Weak subjects (score < 60%)
            try {
                $weakTopics = DB::table('practice_exam_answers')
                    ->join('questions', 'practice_exam_answers.question_id', '=', 'questions.questionID')
                    ->join('subjects', 'questions.subjectID', '=', 'subjects.subjectID')
                    ->where('practice_exam_answers.user_id', $user->userID)
                    ->select('subjects.subjectName as topic', DB::raw('(SUM(CASE WHEN practice_exam_answers.is_correct = 1 THEN 100 ELSE 0 END) / COUNT(*)) as avg_score'))
                    ->groupBy('subjects.subjectName')
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
            
            // Get strongest subject (highest score, reused for summary + insights)
            $strongestSubject = null;
            if ($strongTopics->count() > 0) {
                $strongestSubject = $strongTopics->first()->topic;
            }

            return response()->json([
                'message' => 'Student insights retrieved',
                'data' => [
                    'strongest_subject' => $strongestSubject,
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
                    'practice_exam_results.attempt_id',
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
     * Get frequently mistaken questions (3+ current consecutive wrong answers).
     *
     * Returns full question data with wrong count for review.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getFrequentlyMistaken(Request $request)
    {
        try {
            $user = Auth::user();

            if (!$user || $user->roleID !== 1) {
                return response()->json(['message' => 'Unauthorized. Student access only.'], 403);
            }

            $mistaken = $this->buildQuestionMistakeStats($user->userID)
                ->filter(function ($item) {
                    return (int) ($item['consecutive_wrong_count'] ?? 0) >= 3;
                })
                ->sort(function ($a, $b) {
                    $streakCompare = (int) ($b['consecutive_wrong_count'] ?? 0) <=> (int) ($a['consecutive_wrong_count'] ?? 0);
                    if ($streakCompare !== 0) {
                        return $streakCompare;
                    }
                    return (int) ($b['wrong_count'] ?? 0) <=> (int) ($a['wrong_count'] ?? 0);
                })
                ->values();

            if ($mistaken->isEmpty()) {
                return response()->json([
                    'message' => 'No frequently mistaken questions found',
                    'data' => [],
                ], 200);
            }

            $questionIds = $mistaken->pluck('question_id')->toArray();

            $questions = DB::table('questions')
                ->whereIn('questions.questionID', $questionIds)
                ->leftJoin('subjects', 'questions.subjectID', '=', 'subjects.subjectID')
                ->select(
                    'questions.questionID',
                    'questions.questionText',
                    'questions.image as questionImage',
                    'questions.subjectID',
                    'subjects.subjectName'
                )
                ->get()
                ->keyBy('questionID');

            $choices = DB::table('choices')
                ->whereIn('questionID', $questionIds)
                ->select('choiceID', 'questionID', 'choiceText', 'image as choiceImage', 'isCorrect')
                ->orderBy('position', 'asc')
                ->get()
                ->groupBy('questionID');

            $data = [];
            foreach ($mistaken as $row) {
                $questionId = (int) ($row['question_id'] ?? 0);
                $question = $questions[$questionId] ?? null;
                if (!$question) {
                    continue;
                }

                $questionChoices = $choices[$questionId] ?? collect([]);

                $selectedChoiceId = $row['selected_choice_id'] ?? null;
                $selectedChoiceId = $selectedChoiceId !== null ? (int) $selectedChoiceId : null;

                $data[] = [
                    'questionID' => $question->questionID,
                    'questionText' => $this->safeDecrypt($question->questionText),
                    'questionImage' => $question->questionImage,
                    'subjectID' => $question->subjectID,
                    'subjectName' => $question->subjectName,
                    'wrong_count' => (int) ($row['wrong_count'] ?? 0),
                    'consecutive_wrong_count' => (int) ($row['consecutive_wrong_count'] ?? 0),
                    'selectedChoiceID' => $selectedChoiceId,
                    'selectedAnswerIsCorrect' => (bool) ($row['selected_answer_is_correct'] ?? false),
                    'choices' => $questionChoices->map(function ($c) {
                        return [
                            'choiceID' => $c->choiceID,
                            'choiceText' => $this->safeDecrypt($c->choiceText),
                            'choiceImage' => $c->choiceImage,
                            'isCorrect' => (bool) $c->isCorrect,
                        ];
                    })->values()->all(),
                ];
            }

            return response()->json([
                'message' => 'Frequently mistaken questions retrieved',
                'data' => $data,
            ], 200);
        } catch (\Exception $e) {
            Log::error('Frequently mistaken questions error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error retrieving frequently mistaken questions',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    private function buildQuestionMistakeStats($userId)
    {
        $answers = DB::table('practice_exam_answers')
            ->where('user_id', $userId)
            ->select('question_id', 'selected_choice_id', 'is_correct', 'created_at')
            ->orderBy('question_id', 'asc')
            ->orderBy('created_at', 'asc')
            ->get();

        if ($answers->isEmpty()) {
            return collect([]);
        }

        return $answers
            ->groupBy('question_id')
            ->map(function ($rows, $questionId) {
                $totalWrong = 0;
                $currentStreak = 0;
                $latestAnswer = $rows->last();

                foreach ($rows as $row) {
                    $isCorrect = (int) ($row->is_correct ?? 0) === 1;
                    if ($isCorrect) {
                        // Reset streak once answered correctly.
                        $currentStreak = 0;
                    } else {
                        $totalWrong++;
                        $currentStreak++;
                    }
                }

                return [
                    'question_id' => (int) $questionId,
                    'wrong_count' => $totalWrong,
                    'consecutive_wrong_count' => $currentStreak,
                    'selected_choice_id' => $latestAnswer?->selected_choice_id,
                    'selected_answer_is_correct' => (int) ($latestAnswer?->is_correct ?? 0) === 1,
                ];
            })
            ->values();
    }

    private function safeDecrypt(?string $value): string
    {
        if (!$value) {
            return '';
        }

        try {
            return Crypt::decryptString($value);
        } catch (\Throwable $e) {
            return $value;
        }
    }


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
