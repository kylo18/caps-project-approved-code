<?php

namespace Modules\PracticeExams\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;
use Modules\Questions\Models\Question;
use Modules\PracticeExams\Models\PracticeExamSetting;
use Modules\Subjects\Models\Subject;
use Illuminate\Support\Facades\Crypt;

class PracticeExamController extends Controller
{
    public function generate(Request $request, $subjectID)
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
            ->get()
            ->shuffle();

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

        $difficultyMap = [
            'easy' => $settings->easy_percentage,
            'moderate' => $settings->moderate_percentage,
            'hard' => $settings->hard_percentage
        ];

        // Target total points: 100
        $targetPoints = 100;

        foreach ($difficultyMap as $difficulty => $percentage) {
            $pointsQuota = round(($percentage / 100) * $targetPoints);
            $currentPoints = 0;

            $availableQuestions = collect($grouped[$difficulty])->shuffle();

            foreach ($availableQuestions as $q) {
                if ($currentPoints + $q->points > $pointsQuota) {
                    continue;
                }

                $allChoices = $q->choices->shuffle();
                $correctChoice = $allChoices->where('isCorrect', true)->first();

                // Take 3 random incorrect choices
                $incorrectChoices = $allChoices->where('isCorrect', false)->take(3);

                $finalChoices = $incorrectChoices;
                if ($correctChoice && !$incorrectChoices->contains('choiceID', $correctChoice->choiceID)) {
                    $finalChoices->pop(); // remove one if needed
                    $finalChoices->push($correctChoice);
                }

                $finalChoices = $finalChoices->shuffle()->map(function ($c) {
                    return [
                        'choiceID' => $c->choiceID,
                        'choiceText' => Crypt::decryptString($c->choiceText),
                        'choiceImage' => $c->image ? asset("storage/{$c->image}") : null,
                        'isCorrect' => $c->isCorrect,
                    ];
                })->values();

                $selectedQuestions[] = [
                    'questionID' => $q->questionID,
                     'questionText' => Crypt::decryptString($q->questionText),
                    'questionImage' => $q->image ? asset("storage/{$q->image}") : null,
                    'points' => $q->points,
                    'choices' => $finalChoices,
                ];

                $currentPoints += $q->points;
                $totalPoints += $q->points;

                if ($currentPoints >= $pointsQuota) {
                    break;
                }
            }
        }

        return response()->json([
            'message' => 'Practice exam generated.',
            'totalPoints' => $totalPoints,
            'questions' => $selectedQuestions
        ]);
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
            $questionPoints = $question->points ?? 1;

            $totalPoints += $questionPoints;
            if ($isCorrect) {
                $earnedPoints += $questionPoints;
            }

            $results[] = [
                'questionID' => $question->questionID,
                'questionText' => Crypt::decryptString($question->questionText),
                'selectedChoiceID' => $selectedChoice->choiceID ?? null,
                'isCorrect' => $isCorrect,
                'pointsEarned' => $isCorrect ? $questionPoints : 0,
                'pointsPossible' => $questionPoints
            ];
        }

        $percentage = ($earnedPoints / $totalPoints) * 100;

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
}
