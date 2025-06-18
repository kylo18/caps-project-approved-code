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
use Modules\Questions\Models\Status;
use Modules\Questions\Models\Difficulty;

class PracticeExamController extends Controller
{
    /**
     * Generate a practice exam for a student based on settings.
     */
    public function generate(Request $request, $subjectID)
    {
        try {
            $user = Auth::user();

            // Only students are allowed to generate practice exams
            if ($user->roleID !== 1) {
                return response()->json(['message' => 'Unauthorized.'], 403);
            }

            // Fetch subject (must be assigned to the user's program or general subject)
            $subject = Subject::where(function($query) use ($user, $subjectID) {
                $query->where('subjectID', $subjectID)
                    ->where(function($q) use ($user) {
                        $q->where('programID', $user->programID)
                          ->orWhere('programID', 6); // 6 is for general subjects
                    });
            })->first();

            if (!$subject) {
                return response()->json(['message' => 'Subject not found or not assigned to your program.'], 404);
            }

            // Get practice exam settings for the subject
            $settings = PracticeExamSetting::where('subjectID', $subjectID)->first();
            if (!$settings) {
                return response()->json(['message' => 'Practice Exam settings not configured for this subject.'], 404);
            }

            // Check if practice exam is enabled for this subject
            if (!$settings->isEnabled) {
                return response()->json(['message' => 'Practice exam is currently disabled for this subject.'], 403);
            }

            // Get difficulty IDs
            $difficulties = Difficulty::all()->pluck('id', 'name');

            // Fetch and group questions by difficulty
            $questions = Question::with(['choices' => function($query) {
                $query->orderBy('position', 'asc');
            }])
                ->where('subjectID', $subjectID)
                ->where('purpose_id', 2) // Changed to 2 for practiceQuestions
                ->whereHas('status', function($query) {
                    $query->where('name', '!=', 'pending');
                })
                ->when(!empty($settings->coverage), function($query) use ($settings) {
                    $coverage = strtolower(trim($settings->coverage));
                    if ($coverage === 'full') {
                        return $query->whereIn('coverage_id', [1, 2]); // 1 for midterm, 2 for finals
                    }
                    return $query->where('coverage_id', $coverage === 'midterm' ? 1 : 2);
                })
                ->get()
                ->shuffle();

            // Log the number of questions retrieved
            Log::info('Questions retrieved:', ['count' => $questions->count()]);

            $grouped = [
                $difficulties['easy'] => [], 
                $difficulties['moderate'] => [], 
                $difficulties['hard'] => []
            ];

            foreach ($questions as $q) {
                if (isset($grouped[$q->difficulty_id])) {
                    $grouped[$q->difficulty_id][] = $q;
                }
            }

            // Calculate point quotas per difficulty
            $targetItems = $settings->total_items;
            $difficultyMap = [
                $difficulties['easy'] => $settings->easy_percentage,
                $difficulties['moderate'] => $settings->moderate_percentage,
                $difficulties['hard'] => $settings->hard_percentage,
            ];

            $difficultyQuotas = [];
            $remainingItems = $targetItems;
            foreach (array_keys($difficultyMap) as $i => $difficultyId) {
                if ($i === count($difficultyMap) - 1) {
                    $difficultyQuotas[$difficultyId] = $remainingItems;
                } else {
                    $portion = round(($difficultyMap[$difficultyId] / 100) * $targetItems);
                    $difficultyQuotas[$difficultyId] = $portion;
                    $remainingItems -= $portion;
                }
            }

            // Select and assemble questions
            $selectedQuestions = [];
            $totalPoints = 0;
            $totalItems = 0;

            foreach ($difficultyQuotas as $difficultyId => $itemsQuota) {
                $currentItems = 0;
                $availableQuestions = collect($grouped[$difficultyId])->shuffle();

                foreach ($availableQuestions as $q) {
                    if ($currentItems >= $itemsQuota) {
                        break;
                    }

                    // Get regular choices (excluding "None of the above")
                    $regularChoices = $q->choices->where('position', '!=', 5);
                    $noneChoice = $q->choices->where('position', 5)->first();

                    // Check if "None of the above" is the correct answer
                    $isNoneCorrect = $noneChoice && $noneChoice->isCorrect;

                    // For questions where "None of the above" is correct
                    if ($isNoneCorrect) {
                        // We need at least 4 incorrect regular choices
                        if ($regularChoices->where('isCorrect', false)->count() < 4) {
                            continue;
                        }
                        
                        try {
                            // Take 4 incorrect regular choices
                            $finalRegularChoices = $regularChoices->where('isCorrect', false)
                                ->shuffle()
                                ->take(4)
                                ->map(function ($choice) use ($q) {
                                    return $this->formatChoice($choice, $q);
                                })->values();

                            // Add "None of the above" as the fifth choice
                            $noneOfTheAbove = $this->formatChoice($noneChoice, $q);
                            $finalChoices = $finalRegularChoices->push($noneOfTheAbove);
                        } catch (\Exception $e) {
                            Log::error("Choice processing failed (Question ID: {$q->questionID}): " . $e->getMessage());
                            continue;
                        }
                    } 
                    // For questions where a regular choice is correct
                    else {
                        // Ensure one correct and at least three incorrect choices
                        $correct = $regularChoices->where('isCorrect', true)->first();
                        $incorrect = $regularChoices->where('isCorrect', false)->take(3);

                        if (!$correct || $incorrect->count() < 3) {
                            continue;
                        }

                        try {
                            // First shuffle and process regular choices
                            $finalRegularChoices = $incorrect->push($correct)
                                ->shuffle()
                                ->take(4)
                                ->map(function ($choice) use ($q) {
                                    return $this->formatChoice($choice, $q);
                                })->values();

                            // Add "None of the above" as the fifth choice
                            if ($noneChoice) {
                                $noneOfTheAbove = $this->formatChoice($noneChoice, $q);
                                $finalChoices = $finalRegularChoices->push($noneOfTheAbove);
                            } else {
                                $finalChoices = $finalRegularChoices;
                            }
                        } catch (\Exception $e) {
                            Log::error("Choice processing failed (Question ID: {$q->questionID}): " . $e->getMessage());
                            continue;
                        }
                    }

                    try {
                        // Decrypt question text
                        $questionText = Crypt::decryptString($q->questionText);

                        // Handle question image
                        $questionImage = null;
                        if ($q->image) {
                            if (filter_var($q->image, FILTER_VALIDATE_URL)) {
                                $questionImage = $q->image;
                            } elseif (Storage::disk('public')->exists($q->image)) {
                                $questionImage = asset('storage/' . $q->image);
                            }
                        }

                        $selectedQuestions[] = [
                            'questionID' => $q->questionID,
                            'questionText' => $questionText,
                            'questionImage' => $questionImage,
                            'score' => $q->score,
                            'choices' => $finalChoices,
                        ];

                        $currentItems++;
                        $totalItems++;
                        $totalPoints += $q->score;

                    } catch (\Exception $e) {
                        Log::error("Question processing failed (ID: {$q->questionID}): " . $e->getMessage());
                        continue;
                    }
                }
            }

            return response()->json([
                'message' => 'Practice exam generated successfully.',
                'questions' => $selectedQuestions,
                'totalItems' => $totalItems,
                'totalPoints' => $totalPoints,
                'enableTimer' => $settings->enableTimer,
                'durationMinutes' => $settings->duration_minutes,
                'subjectName' => $subject->subjectName,
            ]);
        } catch (\Exception $e) {
            Log::error('Practice Exam Generation Error: ' . $e->getMessage());
            return response()->json([
                'message' => 'An error occurred while generating the practice exam.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Format a choice for output
     */
    private function formatChoice($choice, $question)
    {
        $decryptedText = null;
        if ($choice->choiceText) {
            try {
                $decryptedText = Crypt::decryptString($choice->choiceText);
            } catch (\Exception $e) {
                Log::error("Choice decryption failed (Question ID: {$question->questionID}, Choice ID: {$choice->choiceID}): " . $e->getMessage());
            }
        }

        $choiceImage = null;
        if ($choice->image) {
            if (filter_var($choice->image, FILTER_VALIDATE_URL)) {
                $choiceImage = $choice->image;
            } elseif (Storage::disk('public')->exists($choice->image)) {
                $choiceImage = asset('storage/' . $choice->image);
            }
        }

        return [
            'choiceID' => $choice->choiceID,
            'choiceText' => $decryptedText,
            'choiceImage' => $choiceImage,
            'isCorrect' => $choice->isCorrect,
            'position' => $choice->position,
        ];
    }

    /**
     * Allow Dean, Program Chair, or Instructor to preview a student's practice exam setup.
     */
    public function previewPracticeExam(Request $request, $subjectID)
    {
        try {
            $user = Auth::user();

            // Only Dean, Program Chair, or Instructor can preview
            if (!in_array($user->roleID, [2, 3, 4])) {
                return response()->json(['message' => 'Unauthorized.'], 403);
            }

            $subject = Subject::find($subjectID);
            if (!$subject) {
                return response()->json(['message' => 'Subject not found.'], 404);
            }

            $settings = PracticeExamSetting::where('subjectID', $subjectID)->first();
            if (!$settings) {
                return response()->json(['message' => 'Practice Exam settings not configured.'], 404);
            }

            // Get difficulty IDs
            $difficulties = Difficulty::all()->pluck('id', 'name');

            // Fetch and group questions by difficulty
            $questions = Question::with(['choices' => function($query) {
                $query->orderBy('position', 'asc');
            }])
                ->where('subjectID', $subjectID)
                ->whereHas('status', function($query) {
                    $query->where('name', '!=', 'pending');
                })
                ->get()
                ->shuffle();

            $grouped = [
                $difficulties['easy'] => [], 
                $difficulties['moderate'] => [], 
                $difficulties['hard'] => []
            ];

            foreach ($questions as $q) {
                if (isset($grouped[$q->difficulty_id])) {
                    $grouped[$q->difficulty_id][] = $q;
                }
            }

            // Calculate quotas
            $difficultyMap = [
                $difficulties['easy'] => $settings->easy_percentage,
                $difficulties['moderate'] => $settings->moderate_percentage,
                $difficulties['hard'] => $settings->hard_percentage,
            ];

            $difficultyQuotas = [];
            $targetPoints = 100;
            $remainingPoints = $targetPoints;

            foreach (array_keys($difficultyMap) as $i => $difficultyId) {
                if ($i === count($difficultyMap) - 1) {
                    $difficultyQuotas[$diffi6cultyId] = $remainingPoints;
                } else {
                    $portion = round(($difficultyMap[$difficultyId] / 100) * $targetPoints);
                    $difficultyQuotas[$difficultyId] = $portion;
                    $remainingPoints -= $portion;
                }
            }

            // Select and prepare questions
            $selectedQuestions = [];
            $totalPoints = 0;

            foreach ($difficultyQuotas as $difficultyId => $pointsQuota) {
                $currentPoints = 0;
                $availableQuestions = collect($grouped[$difficultyId])->shuffle();

                foreach ($availableQuestions as $q) {
                    if ($currentPoints + $q->score > $pointsQuota) {
                        continue;
                    }

                    // Get regular choices (excluding "None of the above")
                    $regularChoices = $q->choices->where('position', '!=', 5);
                    $noneChoice = $q->choices->where('position', 5)->first();

                    // Ensure one correct and at least three incorrect choices
                    $correct = $regularChoices->where('isCorrect', true)->first();
                    $incorrect = $regularChoices->where('isCorrect', false)->take(3);

                    if (!$correct || $incorrect->count() < 3) {
                        continue;
                    }

                    try {
                        // First shuffle and process regular choices (hide isCorrect for preview)
                        $regularFinalChoices = $incorrect->push($correct)
                            ->shuffle()
                            ->take(4)
                            ->map(function ($choice) use ($q) {
                                $formatted = $this->formatChoice($choice, $q);
                                unset($formatted['isCorrect']); // Hide correct answer in preview
                                return $formatted;
                            })->values();

                        // Add "None of the above" as the fifth choice
                        if ($noneChoice) {
                            $noneFormatted = $this->formatChoice($noneChoice, $q);
                            unset($noneFormatted['isCorrect']);
                            $finalChoices = $regularFinalChoices->push($noneFormatted);
                        } else {
                            $finalChoices = $regularFinalChoices;
                        }

                        $questionText = Crypt::decryptString($q->questionText);
                    } catch (\Exception $e) {
                        continue;
                    }

                    $questionImage = $q->image && Storage::disk('public')->exists($q->image)
                        ? asset('storage/' . $q->image)
                        : null;

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
                'message' => 'Preview loaded successfully.',
                'questions' => $selectedQuestions,
                'totalPoints' => $totalPoints,
                'durationMinutes' => $settings->duration_minutes,
            ]);
        } catch (\Exception $e) {
            Log::error('Preview Practice Exam Error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Server error.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Submit a completed practice exam and store results.
     */
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
            'answers.*.selectedChoiceID' => 'nullable|exists:choices,choiceID',
        ]);

        $answers = collect($validated['answers']);
        $totalPoints = 0;
        $earnedPoints = 0;
        $results = [];

        foreach ($answers as $answer) {
            $question = Question::with('choices')->find($answer['questionID']);
            $questionScore = $question->score ?? 1;
            $totalPoints += $questionScore;

            $selectedChoice = $question->choices->firstWhere('choiceID', $answer['selectedChoiceID'] ?? null);
            $isCorrect = $selectedChoice && $selectedChoice->isCorrect;

            if ($isCorrect) {
                $earnedPoints += $questionScore;
            }

            $results[] = [
                'questionID' => $question->questionID,
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
                'percentage' => round($percentage, 2),
            ],
            'results' => $results,
        ]);
    }

    /**
     * Retrieve the student's previous practice exam history.
     */
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
