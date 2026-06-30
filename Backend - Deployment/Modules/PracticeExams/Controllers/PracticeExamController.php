<?php

namespace Modules\PracticeExams\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
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
use Modules\PracticeExams\Models\ExamAttempt;
use Modules\Users\Models\StudentTeacherEnrollment;
use Modules\Users\Models\User;
use Modules\Choices\Models\Choice;
use App\Http\Resources\ExamQuestionResource;

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

            // Persist a server-authoritative attempt: the issued question set,
            // the server-computed denominator, and the time window. Grading and
            // expiry are enforced against THIS row at submission time, so the
            // client can no longer dictate the question list, score, or clock.
            $questionIDs = array_map(fn ($q) => $q['questionID'], $selectedQuestions);
            $enableTimer = (bool) $settings->enableTimer;

            $attempt = ExamAttempt::create([
                'userID'       => $user->userID,
                'subjectID'    => $subject->subjectID,
                'teacher_id'   => null,
                'type'         => 'practice',
                'question_ids' => $questionIDs,
                'total_points' => $totalPoints,
                'started_at'   => now(),
                'expires_at'   => $enableTimer ? now()->addMinutes((int) $settings->duration_minutes) : null,
            ]);

            return response()->json([
                'message' => 'Practice exam generated successfully.',
                'attemptId' => $attempt->id,
                // Resource strips isCorrect — the answer key is never shipped.
                'questions' => ExamQuestionResource::collection($selectedQuestions),
                'totalItems' => $totalItems,
                'totalPoints' => $totalPoints,
                'enableTimer' => $enableTimer,
                'durationMinutes' => $settings->duration_minutes,
                'subjectName' => $subject->subjectName,
            ]);
        } catch (\Exception $e) {
            Log::error('Practice Exam Generation Error: ' . $e->getMessage());
            return response()->json([
                'message' => 'An error occurred while generating the practice exam.',
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
            // (User PK is userID — there is no `id` column, so $user->id would be null)
            $enrolled = StudentTeacherEnrollment::where('student_id', $user->userID)
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
                // Resource strips isCorrect — the answer key is never shipped.
                'questions' => ExamQuestionResource::collection($selectedQuestions),
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
            // SECURITY: never include 'isCorrect' in a student-facing payload.
            // Correctness is resolved server-side at grading time only.
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
                // Route preview through the same enforced contract as generate so
                // every student-reachable question payload strips isCorrect.
                'questions' => ExamQuestionResource::collection($selectedQuestions),
                'totalItems' => $totalItems,
                'totalPoints' => $totalPoints,
                'durationMinutes' => $settings->duration_minutes,
            ]);
        } catch (\Exception $e) {
            Log::error('Preview Practice Exam Error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Server error.',
            ], 500);
        }
    }

    /**
     * Submit a completed practice exam and store results.
     */
    public function submit(Request $request)
    {
        try {
            $user = Auth::user();

            if ($user->roleID !== 1) {
                return response()->json(['message' => 'Unauthorized.'], 403);
            }

            // The client sends ONLY the attempt id and its raw answer selections.
            // It cannot send scores, the question list, or correctness flags.
            $validated = $request->validate([
                'attemptId' => 'required|string|exists:exam_attempts,id',
                'answers' => 'present|array',
                'answers.*.questionID' => 'required|integer',
                'answers.*.selectedChoiceID' => 'nullable|integer',
            ]);

            $attempt = ExamAttempt::find($validated['attemptId']);

            // Ownership check — the attempt must belong to the caller (anti-IDOR).
            if (!$attempt || (int) $attempt->userID !== (int) $user->userID || $attempt->type !== 'practice') {
                return response()->json(['message' => 'Exam attempt not found.'], 404);
            }

            // Prevent duplicate / replayed submissions.
            if ($attempt->isSubmitted()) {
                return response()->json(['message' => 'This exam has already been submitted.'], 409);
            }

            // Server-side timer enforcement, with a 2-minute network grace window.
            if ($attempt->isExpired(120)) {
                $attempt->update(['submitted_at' => now()]); // close it out so it cannot be retried
                return response()->json([
                    'message' => 'Time has expired for this exam. Your attempt can no longer be submitted.',
                ], 422);
            }

            $graded = $this->gradeAttempt($attempt, collect($validated['answers'] ?? []));

            // Atomically claim the attempt so two concurrent submissions cannot
            // both record a result (the isSubmitted() check above is check-then-act
            // and races). A single-statement UPDATE ... WHERE submitted_at IS NULL
            // lets exactly one request win; the loser gets 0 affected rows.
            $claimed = ExamAttempt::whereKey($attempt->id)
                ->whereNull('submitted_at')
                ->update([
                    'answers'      => $graded['answersToStore'],
                    'submitted_at' => now(),
                ]);

            if ($claimed === 0) {
                return response()->json(['message' => 'This exam has already been submitted.'], 409);
            }

            PracticeExamResult::create([
                'userID' => $user->userID,
                'subjectID' => $attempt->subjectID,
                'totalPoints' => $graded['score']['totalPoints'],
                'earnedPoints' => $graded['score']['earnedPoints'],
                'percentage' => $graded['score']['percentage'],
            ]);

            return response()->json([
                'message' => 'Exam submitted successfully.',
                'score' => $graded['score'],
                'results' => $graded['results'],
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Invalid submission.',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('Practice Exam Submit Error: ' . $e->getMessage());
            return response()->json([
                'message' => 'An error occurred while submitting the exam.',
            ], 500);
        }
    }

    /**
     * Grade an attempt server-side against its immutable issued question set.
     *
     * Client-supplied scores are ignored; answers for questions that were not
     * issued in this attempt are discarded; a selected choice that does not
     * belong to its question is treated as unanswered. Correctness derives
     * solely from choices.isCorrect. Returns the score block, a per-question
     * review payload (including the correct answer — safe post-submission), and
     * the normalized answers to persist.
     */
    private function gradeAttempt(ExamAttempt $attempt, $clientAnswers): array
    {
        $questionIDs = $attempt->question_ids ?? [];

        // Eager-load the issued questions + their choices once (avoids N+1).
        $questions = Question::with('choices')
            ->whereIn('questionID', $questionIDs)
            ->get()
            ->keyBy('questionID');

        // Submitted selections keyed by questionID (defensive against duplicates).
        $submitted = collect($clientAnswers)
            ->filter(fn ($a) => isset($a['questionID']))
            ->keyBy('questionID');

        $totalPoints = 0;
        $earnedPoints = 0;
        $results = [];
        $answersToStore = [];

        // Iterate the AUTHORITATIVE issued set — never the client's list.
        foreach ($questionIDs as $questionID) {
            $question = $questions->get($questionID);
            if (!$question) {
                continue; // question removed since issuance; skip safely
            }

            $questionScore = (int) ($question->score ?? 1);
            $totalPoints += $questionScore;

            $selectedChoiceID = $submitted->has($questionID)
                ? ($submitted->get($questionID)['selectedChoiceID'] ?? null)
                : null;
            // Resolve against THIS question's choices only — cross-question or
            // bogus choice IDs collapse to null (counted as unanswered).
            $selectedChoice = $selectedChoiceID !== null
                ? $question->choices->firstWhere('choiceID', (int) $selectedChoiceID)
                : null;

            $correctChoice = $question->choices->firstWhere('isCorrect', true);

            $isCorrect = $selectedChoice !== null && (bool) $selectedChoice->isCorrect;
            if ($isCorrect) {
                $earnedPoints += $questionScore;
            }

            $results[] = [
                'questionID'     => $question->questionID,
                'isCorrect'      => $isCorrect,
                'pointsEarned'   => $isCorrect ? $questionScore : 0,
                'pointsPossible' => $questionScore,
                'selectedChoice' => $this->formatReviewChoice($selectedChoice),
                'correctChoice'  => $this->formatReviewChoice($correctChoice),
            ];

            $answersToStore[] = [
                'questionID'       => $question->questionID,
                'selectedChoiceID' => $selectedChoice?->choiceID,
            ];
        }

        $percentage = round(($earnedPoints / max(1, $totalPoints)) * 100, 2);

        return [
            'score' => [
                'totalPoints'  => $totalPoints,
                'earnedPoints' => $earnedPoints,
                'percentage'   => $percentage,
            ],
            'results' => $results,
            'answersToStore' => $answersToStore,
        ];
    }

    /**
     * Shape a choice for the post-submission review screen (decrypted text +
     * resolved image URL). Revealing the correct answer here is safe because the
     * attempt is already locked. Returns null when there is no choice.
     */
    private function formatReviewChoice($choice): ?array
    {
        if (!$choice) {
            return null;
        }

        $choiceText = null;
        if ($choice->choiceText) {
            try {
                $choiceText = Crypt::decryptString($choice->choiceText);
            } catch (\Exception $e) {
                Log::error("Review choice decryption failed (Choice ID: {$choice->choiceID}): " . $e->getMessage());
            }
        }

        $image = null;
        if ($choice->image) {
            if (filter_var($choice->image, FILTER_VALIDATE_URL)) {
                $image = $choice->image;
            } elseif (Storage::disk('public')->exists($choice->image)) {
                $image = asset('storage/' . $choice->image);
            }
        }

        return [
            'choiceID'   => $choice->choiceID,
            'choiceText' => $choiceText,
            'image'      => $image,
        ];
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

        // Check enrollment (User PK is userID — $user->id would be null)
        $enrolled = StudentTeacherEnrollment::where('student_id', $user->userID)
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
            'student_id' => $user->userID,
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

    /**
     * Get all exam results for the authenticated student for a given subject,
     * including each score, average score, date/time, their name, and their program.
     */
    public function subjectExamResults(Request $request, $subjectID)
    {
        $authUser = Auth::user();
        if (!$authUser) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $query = PracticeExamResult::with(['subject', 'user.program'])
            ->where('subjectID', $subjectID);

        // Authorization (anti-IDOR): students may only see their OWN results for
        // the subject; faculty/chair/dean may see all (PracticeExamResultPolicy).
        if ((int) $authUser->roleID === 1) {
            $query->where('userID', $authUser->userID);
        } elseif (Gate::forUser($authUser)->denies('viewAny', PracticeExamResult::class)) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        // Fetch results for the given subject, with user and program info
        $results = $query
            ->orderBy('created_at', 'desc')
            ->get();

        // Map results to include student-specific info
        $history = $results->map(function ($record) {
            $user = $record->user;
            return [
                'resultID' => $record->resultID,
                'subjectID' => $record->subjectID,
                'subjectName' => $record->subject->subjectName ?? 'Unknown Subject',
                'totalPoints' => $record->totalPoints,
                'earnedPoints' => $record->earnedPoints,
                'percentage' => $record->percentage,
                'created_at' => $record->created_at,
                'studentName' => $user ? ($user->firstName . ' ' . $user->lastName) : 'Unknown Student',
                'program' => $user ? optional($user->program)->programName : null,
            ];
        });

        // Calculate the overall average score for the subject
        $averageScore = $results->avg('percentage');

        return response()->json([
            'message' => 'All exam results for subject retrieved successfully.',
            'history' => $history,
            'averageScore' => round($averageScore, 2),
        ]);
    }
    /**
     * Get all exam results for all students (not filtered by subject).
     */

    public function getAllExamResults(Request $request)
    {
        try {
            $authUser = Auth::user();
            // Function-level authorization: this cross-student view is for
            // faculty/chair/dean only — students must use their own history().
            if (!$authUser || Gate::forUser($authUser)->denies('viewAny', PracticeExamResult::class)) {
                return response()->json(['message' => 'Unauthorized.'], 403);
            }

            $results = PracticeExamResult::all();
            return response()->json([
                'message' => 'All exam results for all students retrieved successfully.',
                'results' => $results,
            ]);
        } catch (\Exception $e) {
            \Log::error('getAllExamResults error: ' . $e->getMessage());
            return response()->json([
                'message' => 'An error occurred while fetching all student exam results.',
            ], 500);
        }
    }
    /**
     * Leaderboard: Returns students' average exam percentages for a subject, sorted highest to lowest.
     * Includes student name, program, and average score.
     */
    public function leaderboard(Request $request, $subjectID)
    {
        // Get all students who took the exam for this subject
        $results = PracticeExamResult::with('user.program')
            ->where('subjectID', $subjectID)
            ->get();

        // Group by user and calculate average
        $leaderboard = $results->groupBy('userID')->map(function($records, $userID) {
            $user = $records->first()->user;
            $average = $records->avg('percentage');
            return [
                'userID' => $userID,
                'studentName' => $user ? ($user->firstName . ' ' . $user->lastName) : 'Unknown',
                'program' => optional($user->program)->programName,
                'averageScore' => round($average, 2),
                'attempts' => $records->count(),
            ];
        })->values()->sortByDesc('averageScore')->values();

        return response()->json([
            'message' => 'Leaderboard retrieved successfully.',
            'leaderboard' => $leaderboard
        ]);
    }
}
