<?php

namespace Modules\PracticeExams\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;
use Modules\Questions\Models\Question;
use Modules\PracticeExams\Models\PracticeExamSetting;
use Modules\Subjects\Models\Subject;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Modules\PracticeExams\Models\PracticeExamResult;

class PracticeExamController extends Controller
{
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

                    try {
                        $finalChoices = $incorrect->push($correct)->shuffle()->map(function ($choice) use ($q) {
                            // Handle decryption
                            $decryptedText = null;
                            if ($choice->choiceText) {
                                try {
                                    $decryptedText = Crypt::decryptString($choice->choiceText);
                                } catch (\Exception $e) {
                                    Log::error("Choice decryption failed (Question ID: {$q->questionID}, Choice ID: {$choice->choiceID}): " . $e->getMessage());
                                }
                            }
                            // Handle image check with logging
                            $choiceImage = null;
                            if ($choice->image) {
                                if (Storage::disk('public')->exists($choice->image)) {
                                    $choiceImage = asset('storage/' . $choice->image);
                                } else {
                                    Log::warning("Choice image not found (Question ID: {$q->questionID}, Choice ID: {$choice->choiceID}): " . $choice->image);
                                }
                            }

                            return [
                                'choiceID' => $choice->choiceID,
                                'choiceText' => $decryptedText,
                                'choiceImage' => $choiceImage,
                                'isCorrect' => $choice->isCorrect,
                            ];
                        })->values();
                    } catch (\Exception $e) {
                        Log::error("Choice processing failed (Question ID: {$q->questionID}): " . $e->getMessage());
                        continue;
                    }

                    try {
                        $questionText = Crypt::decryptString($q->questionText);
                    } catch (\Exception $e) {
                        Log::error("Question decryption failed (ID: {$q->questionID}): " . $e->getMessage());
                        continue;
                    }

                    $questionImage = null;

                    if ($q->image) {
                        if (Storage::disk('public')->exists($q->image)) {
                            $questionImage = asset('storage/' . $q->image);
                        } else {
                            Log::warning("Question image not found", [
                                'questionID' => $q->questionID,
                                'imagePath' => $q->image
                            ]);
                        }
                    }
                    $selectedQuestions[] = [
                        'questionID' => $q->questionID,
                        'questionText' => $questionText,
                        'questionImage' => $questionImage,
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
            Log::error('Practice Exam Generation Error: ' . $e->getMessage());
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
            'answers.*.selectedChoiceID' => 'nullable|exists:choices,choiceID'
        ]);

        $answers = collect($validated['answers']);
        $totalPoints = 0;
        $earnedPoints = 0;
        $results = [];

        foreach ($answers as $answer) {
            $question = Question::with('choices')->find($answer['questionID']);
            $questionScore = $question->score ?? 1;
            $totalPoints += $questionScore;

            $selectedChoice = $question->choices->where('choiceID', $answer['selectedChoiceID'] ?? null)->first();

            $isCorrect = $selectedChoice && $selectedChoice->isCorrect;

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
