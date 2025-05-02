<?php

namespace Modules\PracticeExams\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;
use Modules\Questions\Models\Question;
use Modules\PracticeExams\Models\PracticeExamSetting;
use Modules\Subjects\Models\Subject;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Str;
use Modules\PracticeExams\Models\PracticeExamResult;

class PracticeExamController extends Controller
{
    /* public function generate($subjectID)
    {
        $user = Auth::user();

        if ($user->roleID !== 1) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $subject = Subject::where('subjectID', $subjectID)
            ->where('programID', $user->programID)
            ->first();

        if (!$subject) {
            return response()->json(['message' => 'Subject not found or not assigned to your program.'], 404);
        }

        $settings = PracticeExamSetting::where('subjectID', $subjectID)->first();

        if (!$settings) {
            return response()->json(['message' => 'Practice Exam settings not configured for this subject.'], 404);
        }

        $questions = Question::with('choices')
            ->where('subjectID', $subjectID)
            ->where('status', '!=', 'pending')
            ->get()
            ->shuffle();

        // Normalize question images up front
        foreach ($questions as $q) {
            if ($q->image && !Str::startsWith($q->image, ['http://', 'https://'])) {
                $q->image = url("storage/{$q->image}");
            }
            foreach ($q->choices as $c) {
                if ($c->image && !Str::startsWith($c->image, ['http://', 'https://'])) {
                    $c->image = url("storage/{$c->image}");
                }
            }
        }

        $grouped = [
            'easy' => [],
            'moderate' => [],
            'hard' => []
        ];

        foreach ($questions as $q) {
            $grouped[$q->difficulty][] = $q;
        }

        $selectedQuestions = [];
        $totalPoints = 0;
        $targetPoints = 100;

        $difficultyMap = [
            'easy' => $settings->easy_percentage,
            'moderate' => $settings->moderate_percentage,
            'hard' => $settings->hard_percentage,
        ];

        $difficultyKeys = array_keys($difficultyMap);
        $difficultyQuotas = [];
        $remainingPoints = $targetPoints;

        foreach ($difficultyKeys as $index => $difficulty) {
            if ($index == count($difficultyKeys) - 1) {
                $pointsQuota = $remainingPoints;
            } else {
                $pointsQuota = round(($difficultyMap[$difficulty] / 100) * $targetPoints);
                $remainingPoints -= $pointsQuota;
            }
            $difficultyQuotas[$difficulty] = $pointsQuota;
        }

        foreach ($difficultyQuotas as $difficulty => $pointsQuota) {
            $currentPoints = 0;
            $availableQuestions = collect($grouped[$difficulty])->shuffle();

            foreach ($availableQuestions as $q) {
                if ($currentPoints + $q->score > $pointsQuota) {
                    continue;
                }

                $allChoices = $q->choices->shuffle();
                $correctChoice = $allChoices->where('isCorrect', true)->first();
                if (!$correctChoice) {
                    continue;
                }

                $incorrectChoices = $allChoices->where('isCorrect', false)->take(3);

                if ($incorrectChoices->count() < 3) {
                    $incorrectChoices = $allChoices->where('isCorrect', false);
                }

                $finalChoices = $incorrectChoices->push($correctChoice)->shuffle()->map(function ($c) {
                    return [
                        'choiceID' => $c->choiceID,
                        'choiceText' => Crypt::decryptString($c->choiceText),
                        'choiceImage' => $c->image ?? null,
                        'isCorrect' => $c->isCorrect,
                    ];
                })->values();

                $selectedQuestions[] = [
                    'questionID' => $q->questionID,
                    'questionText' => Crypt::decryptString($q->questionText),
                    'questionImage' => $q->image ?? null,
                    'score' => $q->score,
                    'choices' => $finalChoices,
                ];

                $currentPoints += $q->score;
                $totalPoints += $q->score;

                if ($currentPoints >= $pointsQuota) {
                    break;
                }
            }
        }

        return response()->json([
            'message' => 'Practice exam generated successfully.',
            'questions' => $selectedQuestions,
            'totalPoints' => $totalPoints
        ]);
    } */

    public function generate(Request $request, $subjectID)
    {
        try {
            $user = Auth::user();

            if ($user->roleID !== 1) {
                return response()->json(['message' => 'Unauthorized.'], 403);
            }

            $subject = Subject::where('subjectID', $subjectID)
                ->where('programID', $user->programID)
                ->first();

            if (!$subject) {
                return response()->json(['message' => 'Subject not found or not assigned to your program.'], 404);
            }

            $settings = PracticeExamSetting::where('subjectID', $subjectID)->first();
            if (!$settings) {
                return response()->json(['message' => 'Practice Exam settings not configured for this subject.'], 404);
            }

            $questions = Question::with('choices')
                ->where('subjectID', $subjectID)
                ->where('status', '!=', 'pending')
                ->get()
                ->shuffle();

            $grouped = [
                'easy' => [],
                'moderate' => [],
                'hard' => []
            ];

            foreach ($questions as $q) {
                if (isset($grouped[$q->difficulty])) {
                    $grouped[$q->difficulty][] = $q;
                }
            }

            $targetPoints = 100;
            $difficultyMap = [
                'easy' => $settings->easy_percentage,
                'moderate' => $settings->moderate_percentage,
                'hard' => $settings->hard_percentage,
            ];

            $difficultyQuotas = [];
            $remainingPoints = $targetPoints;

            foreach (array_keys($difficultyMap) as $i => $difficulty) {
                if ($i === count($difficultyMap) - 1) {
                    $difficultyQuotas[$difficulty] = $remainingPoints;
                } else {
                    $portion = round(($difficultyMap[$difficulty] / 100) * $targetPoints);
                    $difficultyQuotas[$difficulty] = $portion;
                    $remainingPoints -= $portion;
                }
            }

            $selectedQuestions = [];
            $totalPoints = 0;

            foreach ($difficultyQuotas as $difficulty => $pointsQuota) {
                $currentPoints = 0;
                $availableQuestions = collect($grouped[$difficulty])->shuffle();

                foreach ($availableQuestions as $q) {
                    if ($currentPoints + $q->score > $pointsQuota) {
                        continue;
                    }

                    $shuffledChoices = $q->choices->shuffle();
                    $correct = $shuffledChoices->where('isCorrect', true)->first();
                    $incorrect = $shuffledChoices->where('isCorrect', false)->take(3);

                    if (!$correct || $incorrect->count() < 3) {
                        continue;
                    }

                    $finalChoices = $incorrect->push($correct)->shuffle()->map(function ($choice) {
                        return [
                            'choiceID' => $choice->choiceID,
                            'choiceText' => Crypt::decryptString($choice->choiceText),
                            'choiceImage' => $choice->image ? url('storage/' . ltrim($choice->image, '/')) : null,
                            'isCorrect' => $choice->isCorrect,
                        ];
                    })->values();

                    $selectedQuestions[] = [
                        'questionID' => $q->questionID,
                        'questionText' => Crypt::decryptString($q->questionText),
                        'questionImage' => $q->image ? url('storage/' . ltrim($q->image, '/')) : null,
                        'score' => $q->score,
                        'choices' => $finalChoices,
                    ];

                    $currentPoints += $q->score;
                    $totalPoints += $q->score;

                    if ($currentPoints >= $pointsQuota) {
                        break;
                    }
                }
            }

            return response()->json([
                'message' => 'Practice exam generated successfully.',
                'questions' => $selectedQuestions,
                'totalPoints' => $totalPoints
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'An error occurred while generating the practice exam.',
                'error' => $e->getMessage()
            ], 500);
        }
    }


    public function submit(Request $request)
    {
        $user = Auth::user();

        if ($user->roleID !== 1) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $validated = $request->validate([
            'subjectID' => 'required|exists:subjects,subjectID',
            'answers' => 'required|array',
            'answers.*.questionID' => 'required|exists:questions,questionID',
            'answers.*.selectedChoiceID' => 'required|exists:choices,choiceID'
        ]);

        $answers = collect($validated['answers']);
        $totalPoints = 0;
        $earnedPoints = 0;
        $results = [];

        foreach ($answers as $answer) {
            $question = Question::with('choices')->find($answer['questionID']);
            $selectedChoice = $question->choices->where('choiceID', $answer['selectedChoiceID'])->first();

            $isCorrect = $selectedChoice && $selectedChoice->isCorrect;
            $questionScore = $question->score ?? 1;

            $totalPoints += $questionScore;
            if ($isCorrect) {
                $earnedPoints += $questionScore;
            }

            $results[] = [
                'questionID' => $question->questionID,
                'questionText' => Crypt::decryptString($question->questionText),
                'selectedChoiceID' => $selectedChoice->choiceID ?? null,
                'selectedChoiceText' => $selectedChoice ? Crypt::decryptString($selectedChoice->choiceText) : null,
                'isCorrect' => $isCorrect,
                'pointsEarned' => $isCorrect ? $questionScore : 0,
                'pointsPossible' => $questionScore,
            ];
        }

        $percentage = ($earnedPoints / max(1, $totalPoints)) * 100;

        PracticeExamResult::create([
            'userID' => $user->userID,
            'subjectID' => $validated['subjectID'],
            'totalPoints' => $totalPoints,
            'earnedPoints' => $earnedPoints,
            'percentage' => round($percentage, 2),
        ]);

        return response()->json([
            'message' => 'Exam submitted successfully.',
            'score' => [
                'totalPoints' => $totalPoints,
                'earnedPoints' => $earnedPoints,
                'percentage' => round($percentage, 2)
            ],
            'results' => $results
        ]);
    }



    public function history()
    {
        $user = Auth::user();

        if ($user->roleID !== 1) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $history = PracticeExamResult::with('subject')
            ->where('userID', $user->userID)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($record) {
                return [
                    'resultID' => $record->resultID,
                    'subjectID' => $record->subjectID,
                    'subjectName' => $record->subject->subjectName ?? 'Unknown Subject',
                    'totalPoints' => $record->totalPoints,
                    'earnedPoints' => $record->earnedPoints,
                    'percentage' => $record->percentage,
                    'created_at' => $record->created_at,
                ];
            });

        return response()->json([
            'message' => 'History retrieved successfully.',
            'history' => $history,
        ]);
    }
}
