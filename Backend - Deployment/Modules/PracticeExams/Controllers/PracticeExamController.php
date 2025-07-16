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
use Modules\PracticeExams\Models\PersonalExamSetting;
use Modules\Users\Models\StudentTeacherEnrollment;
use Modules\Users\Models\User;

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
     * Generate a personal exam for a student based on settings and selected teacher.
     */
    public function generatePersonalExam(Request $request, $subjectID, $teacherID)
    {
        try {
            $user = Auth::user();

            // Only students are allowed
            if ($user->roleID !== 1) {
                return response()->json(['message' => 'Unauthorized.'], 403);
            }

            // Check if student is enrolled with the teacher
            $enrolled = StudentTeacherEnrollment::where('student_id', $user->id)
                ->where('teacher_id', $teacherID)
                ->exists();
            if (!$enrolled) {
                return response()->json(['message' => 'You are not enrolled with this teacher.'], 403);
            }

            // Fetch subject
            $subject = Subject::where('subjectID', $subjectID)->first();
            if (!$subject) {
                return response()->json(['message' => 'Subject not found.'], 404);
            }

            // Get personal exam settings for the subject and teacher
            $settings = PersonalExamSetting::where('subjectID', $subjectID)
                ->where('createdBy', $teacherID)
                ->first();
            if (!$settings) {
                return response()->json(['message' => 'Personal Exam settings not configured for this subject and teacher.'], 404);
            }

            if (!$settings->isEnabled) {
                return response()->json(['message' => 'Personal exam is currently disabled for this subject and teacher.'], 403);
            }

            // Get difficulty IDs
            $difficulties = Difficulty::all()->pluck('id', 'name');

            // Fetch and group questions by difficulty
            $questions = Question::with(['choices' => function($query) {
                $query->orderBy('position', 'asc');
            }])
                ->where('subjectID', $subjectID)
                ->where('purpose_id', 3) // Personal questions
                ->where('createdBy', $teacherID)
                ->whereHas('status', function($query) {
                    $query->where('name', '!=', 'pending');
                })
                ->when(!empty($settings->coverage), function($query) use ($settings) {
                    $coverage = strtolower(trim($settings->coverage));
                    if ($coverage === 'full') {
                        return $query->whereIn('coverage_id', [1, 2]);
                    }
                    return $query->where('coverage_id', $coverage === 'midterm' ? 1 : 2);
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

            // Calculate quotas per difficulty
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

                    if ($isNoneCorrect) {
                        if ($regularChoices->where('isCorrect', false)->count() < 4) {
                            continue;
                        }
                        try {
                            $finalRegularChoices = $regularChoices->where('isCorrect', false)
                                ->shuffle()
                                ->take(4)
                                ->map(function ($choice) use ($q) {
                                    return $this->formatChoice($choice, $q);
                                })->values();
                            $noneOfTheAbove = $this->formatChoice($noneChoice, $q);
                            $finalChoices = $finalRegularChoices->push($noneOfTheAbove);
                        } catch (\Exception $e) {
                            Log::error("Choice processing failed (Question ID: {$q->questionID}): " . $e->getMessage());
                            continue;
                        }
                    } else {
                        $correct = $regularChoices->where('isCorrect', true)->first();
                        $incorrect = $regularChoices->where('isCorrect', false)->take(3);
                        if (!$correct || $incorrect->count() < 3) {
                            continue;
                        }
                        try {
                            $finalRegularChoices = $incorrect->push($correct)
                                ->shuffle()
                                ->take(4)
                                ->map(function ($choice) use ($q) {
                                    return $this->formatChoice($choice, $q);
                                })->values();
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
                        $questionText = Crypt::decryptString($q->questionText);
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
                'message' => 'Personal exam generated successfully.',
                'questions' => $selectedQuestions,
                'totalItems' => $totalItems,
                'totalPoints' => $totalPoints,
                'enableTimer' => $settings->enableTimer,
                'durationMinutes' => $settings->duration_minutes,
                'subjectName' => $subject->subjectName,
                'teacherName' => User::find($teacherID)->name ?? 'Unknown',
            ]);
        } catch (\Exception $e) {
            Log::error('Personal Exam Generation Error: ' . $e->getMessage());
            return response()->json([
                'message' => 'An error occurred while generating the personal exam.',
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

            // Build base query for questions
            $questionQuery = Question::with(['choices' => function($query) {
                $query->orderBy('position', 'asc');
            }, 'user'])
                ->where('subjectID', $subjectID)
                ->where('purpose_id', 2)
                ->whereHas('status', function($query) {
                    $query->where('name', '!=', 'pending');
                });

            // Apply coverage filter from settings
            if (!empty($settings->coverage)) {
                $coverage = strtolower(trim($settings->coverage));
                if ($coverage === 'full') {
                    $questionQuery->whereIn('coverage_id', [1, 2]);
                } else {
                    $questionQuery->where('coverage_id', $coverage === 'midterm' ? 1 : 2);
                }
            }

            // Role-based filtering
            switch ($user->roleID) {
                case 5: // Associate Dean
                    $questionQuery->whereHas('user', function($q) use ($user) {
                        $q->where('campusID', $user->campusID);
                    });
                    break;
                case 3: // Program Chair
                    $questionQuery->whereHas('user', function($q) use ($user) {
                        $q->where('campusID', $user->campusID)
                          ->where('programID', $user->programID);
                    });
                    break;
                case 2: // Faculty
                    $questionQuery->where('userID', $user->userID);
                    break;
                case 1: // Student
                    // Only allow questions for their program or general (programID == user.programID or programID == 6)
                    $questionQuery->whereHas('user', function($q) use ($user) {
                        $q->where(function($subQ) use ($user) {
                            $subQ->where('programID', $user->programID)
                                 ->orWhere('programID', 6);
                        });
                    });
                    break;
                // Dean (4) and others: no extra filter
            }

            $questions = $questionQuery->get()->shuffle();

            // Group questions by difficulty
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

            // Calculate quotas (use total_items for quotas, like generate)
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

            // Select and prepare questions (same as generate, but hide isCorrect in preview)
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
                    $regularChoices = $q->choices->where('position', '!=', 5);
                    $noneChoice = $q->choices->where('position', 5)->first();
                    $isNoneCorrect = $noneChoice && $noneChoice->isCorrect;
                    if ($isNoneCorrect) {
                        if ($regularChoices->where('isCorrect', false)->count() < 4) {
                            continue;
                        }
                        try {
                            $finalRegularChoices = $regularChoices->where('isCorrect', false)
                                ->shuffle()
                                ->take(4)
                                ->map(function ($choice) use ($q) {
                                    $formatted = $this->formatChoice($choice, $q);
                                    unset($formatted['isCorrect']);
                                    return $formatted;
                                })->values();
                            $noneOfTheAbove = $this->formatChoice($noneChoice, $q);
                            unset($noneOfTheAbove['isCorrect']);
                            $finalChoices = $finalRegularChoices->push($noneOfTheAbove);
                        } catch (\Exception $e) {
                            continue;
                        }
                    } else {
                        $correct = $regularChoices->where('isCorrect', true)->first();
                        $incorrect = $regularChoices->where('isCorrect', false)->take(3);
                        if (!$correct || $incorrect->count() < 3) {
                            continue;
                        }
                        try {
                            $finalRegularChoices = $incorrect->push($correct)
                                ->shuffle()
                                ->take(4)
                                ->map(function ($choice) use ($q) {
                                    $formatted = $this->formatChoice($choice, $q);
                                    unset($formatted['isCorrect']);
                                    return $formatted;
                                })->values();
                            if ($noneChoice) {
                                $noneOfTheAbove = $this->formatChoice($noneChoice, $q);
                                unset($noneOfTheAbove['isCorrect']);
                                $finalChoices = $finalRegularChoices->push($noneOfTheAbove);
                            } else {
                                $finalChoices = $finalRegularChoices;
                            }
                        } catch (\Exception $e) {
                            continue;
                        }
                    }
                    try {
                        $questionText = Crypt::decryptString($q->questionText);
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
                        continue;
                    }
                }
            }
            return response()->json([
                'message' => 'Preview loaded successfully.',
                'questions' => $selectedQuestions,
                'totalItems' => $totalItems,
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
     * Submit a completed personal practice exam and store results.
     */
    public function submitPersonalExam(Request $request)
    {
        $user = Auth::user();

        if ($user->roleID !== 1) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $validated = $request->validate([
            'subjectID' => 'required|exists:subjects,subjectID',
            'teacher_id' => 'required|exists:users,userID',
            'answers' => 'required|array',
            'answers.*.questionID' => 'required|exists:questions,questionID',
            'answers.*.selectedChoiceID' => 'nullable|exists:choices,choiceID',
        ]);

        // Check enrollment
        $enrolled = StudentTeacherEnrollment::where('student_id', $user->id)
            ->where('teacher_id', $validated['teacher_id'])
            ->exists();
        if (!$enrolled) {
            return response()->json(['message' => 'You are not enrolled with this teacher.'], 403);
        }

        $answers = collect($validated['answers']);
        $totalPoints = 0;
        $earnedPoints = 0;
        $results = [];

        foreach ($answers as $answer) {
            $question = Question::with('choices')->find($answer['questionID']);
            // Only count questions created by the teacher and purpose_id = 3
            if ($question->createdBy != $validated['teacher_id'] || $question->purpose_id != 3) {
                continue;
            }
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

        \Modules\PracticeExams\Models\PersonalPracticeExamResult::create([
            'student_id' => $user->id,
            'subjectID' => $validated['subjectID'],
            'teacher_id' => $validated['teacher_id'],
            'totalPoints' => $totalPoints,
            'earnedPoints' => $earnedPoints,
            'percentage' => round($percentage, 2),
        ]);

        return response()->json([
            'message' => 'Personal exam submitted successfully.',
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
