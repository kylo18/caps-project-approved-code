<?php

namespace Modules\Print\Controllers;

use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Log;
use Modules\Questions\Models\Question;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Modules\Subjects\Models\Subject;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Modules\Users\Models\User;

class PrintController extends Controller
{
    private $sessionLifetime = 3600; // 1 hour in seconds

    private function generateUrl($path)
    {
        if (!$path) {
            return null;
        }
        if (\Illuminate\Support\Str::startsWith($path, ['http://', 'https://'])) {
            return preg_replace('/^http:/i', 'https:', $path);
        }
        if (!\Illuminate\Support\Facades\Storage::disk('public')->exists($path)) {
            return null;
        }
        $url = asset('storage/' . $path);
        return preg_replace('/^http:/i', 'https:', $url);
    }

    private function getBase64ImageData($path)
    {
        try {
            // Try public storage
            if (\Illuminate\Support\Facades\Storage::disk('public')->exists($path)) {
                $file = \Illuminate\Support\Facades\Storage::disk('public')->get($path);
                $type = \Illuminate\Support\Facades\Storage::disk('public')->mimeType($path);
                $base64 = base64_encode($file);
                return "data:$type;base64,$base64";
            }
            // Try absolute path
            if (file_exists($path)) {
                $type = mime_content_type($path);
                $file = file_get_contents($path);
                $base64 = base64_encode($file);
                return "data:$type;base64,$base64";
            }
            // Try resource path
            $altPath = resource_path('assets/images/' . basename($path));
            if (file_exists($altPath)) {
                $type = mime_content_type($altPath);
                $file = file_get_contents($altPath);
                $base64 = base64_encode($file);
                return "data:$type;base64,$base64";
            }
            return null;
        } catch (\Exception $e) {
            \Log::error('Base64 image conversion failed', ['path' => $path, 'error' => $e->getMessage()]);
            return null;
        }
    }

    private function formatQuestions($questions, $subject = null)
    {
        try {
            $formattedQuestions = [];
            foreach ($questions as $q) {
                try {
                    $questionText = Crypt::decryptString($q->questionText);
                    $questionImage = null;
                    if ($q->image) {
                        $imagePath = 'question_images/' . basename($q->image);
                        $questionImage = $this->getBase64ImageData($imagePath);
                    }
                    $choices = [];
                    $regularChoices = [];
                    $noneChoice = null;
                    foreach ($q->choices as $choice) {
                        try {
                            $choiceText = $choice->choiceText ? Crypt::decryptString($choice->choiceText) : null;
                            $choiceImage = null;
                            if ($choice->image) {
                                $imagePath = 'choices/' . basename($choice->image);
                                $choiceImage = $this->getBase64ImageData($imagePath);
                            }
                            $formattedChoice = [
                                'choiceText' => $choiceText,
                                'choiceImage' => $choiceImage,
                                'isCorrect' => $choice->isCorrect
                            ];
                            if ($choice->position === 5) {
                                $noneChoice = $formattedChoice;
                            } else {
                                $regularChoices[] = $formattedChoice;
                            }
                        } catch (\Exception $e) {
                            Log::error('Choice formatting failed:', [
                                'choiceID' => $choice->choiceID,
                                'error' => $e->getMessage()
                            ]);
                            continue;
                        }
                    }
                    shuffle($regularChoices);
                    $choices = array_merge($regularChoices, $noneChoice ? [$noneChoice] : []);
                    $formattedQuestions[] = [
                        'questionText' => $questionText,
                        'questionImage' => $questionImage,
                        'choices' => $choices,
                        'score' => $q->score,
                        'subject' => $subject ? $subject->subjectName : null,
                        'difficulty' => $q->difficulty ? $q->difficulty->name : null,
                    ];
                } catch (\Exception $e) {
                    Log::error('Question formatting failed:', [
                        'questionID' => $q->questionID,
                        'error' => $e->getMessage()
                    ]);
                    continue;
                }
            }
            shuffle($formattedQuestions);
            return $formattedQuestions;
        } catch (\Exception $e) {
            Log::error('Questions formatting failed:', [
                'error' => $e->getMessage()
            ]);
            return [];
        }
    }

    private function getBase64Image($path)
    {
        try {
            if (file_exists($path)) {
                $imagePath = str_replace('storage/', '', $path);
                return url('storage/' . $imagePath);
            }
            $altPath = resource_path('assets/images/' . basename($path));
            if (file_exists($altPath)) {
                return url('storage/images/' . basename($path));
            }
            Log::warning('Logo file not found:', ['path' => $path, 'altPath' => $altPath]);
            return null;
        } catch (\Exception $e) {
            Log::error('Error reading image:', ['path' => $path, 'error' => $e->getMessage()]);
            return null;
        }
    }

    /**
     * Generate a multi-subject examination preview (JSON only)
     */
    public function generateMultiSubjectExam(Request $request)
    {
        try {
            Log::info('Multi-Subject Exam Request:', [
                'request_data' => $request->all(),
                'user_id' => Auth::id()
            ]);
            try {
                $user = Auth::user();
                if (!$user) {
                    throw new \Exception('User not authenticated');
                }
                if (!in_array($user->roleID, [3, 4, 5])) {
                    throw new \Exception('User role not authorized. Role ID: ' . $user->roleID);
                }
            } catch (\Exception $e) {
                Log::error('Authentication Error:', [
                    'error' => $e->getMessage(),
                    'user' => Auth::id() ?? 'none'
                ]);
                return response()->json([
                    'status' => 'error',
                    'message' => 'Authentication Error',
                    'details' => 'You are not authorized to generate multi-subject exams. Only Program Chair, Dean, and Associate Dean can perform this action.',
                    'code' => 'AUTH_ERROR',
                    'action' => 'Please contact your administrator if you believe this is an error.'
                ], 401);
            }
            $request->merge(['purpose' => 'examQuestions']);
            try {
                $validated = $request->validate([
                    'total_items' => 'required|integer|min:1',
                    'subjects' => 'required|array|min:1',
                    'subjects.*.subjectID' => 'required|exists:subjects,subjectID',
                    'subjects.*.percentage' => 'required|integer|min:1|max:100',
                    'difficulty_distribution' => 'required|array',
                    'difficulty_distribution.easy' => 'required|integer|min:0|max:100',
                    'difficulty_distribution.moderate' => 'required|integer|min:0|max:100',
                    'difficulty_distribution.hard' => 'required|integer|min:0|max:100',
                    'preview' => 'boolean',
                    'previewKey' => 'nullable|string'
                ]);
            } catch (\Illuminate\Validation\ValidationException $e) {
                Log::error('Validation Error:', [
                    'errors' => $e->errors(),
                    'request_data' => $request->all()
                ]);
                return response()->json([
                    'status' => 'error',
                    'message' => 'Input Validation Error',
                    'details' => 'Please check your input values. All fields are required and must be within valid ranges.',
                    'errors' => $e->errors(),
                    'code' => 'VALIDATION_ERROR',
                    'action' => 'Please review the form and ensure all fields are filled correctly.'
                ], 422);
            }
            $validated['purpose'] = 'examQuestions';
            try {
                $purpose = \Modules\Questions\Models\Purpose::where('name', 'examQuestions')->first();
                if (!$purpose) {
                    throw new \Exception('ExamQuestions purpose not found in database');
                }
            } catch (\Exception $e) {
                Log::error('Purpose Retrieval Error:', [
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString()
                ]);
                return response()->json([
                    'status' => 'error',
                    'message' => 'System Configuration Error',
                    'details' => 'Unable to process exam generation. The system is not properly configured.',
                    'code' => 'CONFIG_ERROR',
                    'action' => 'Please contact system administrator to resolve this issue.'
                ], 500);
            }
            try {
                $totalSubjectPercentage = collect($validated['subjects'])->sum('percentage');
                if ($totalSubjectPercentage !== 100) {
                    throw new \Exception("Subject percentages sum to {$totalSubjectPercentage}%, expected 100%");
                }
                $totalDifficultyPercentage = $validated['difficulty_distribution']['easy'] +
                                           $validated['difficulty_distribution']['moderate'] +
                                           $validated['difficulty_distribution']['hard'];
                if ($totalDifficultyPercentage !== 100) {
                    throw new \Exception("Difficulty percentages sum to {$totalDifficultyPercentage}%, expected 100%");
                }
            } catch (\Exception $e) {
                Log::error('Percentage Validation Error:', [
                    'error' => $e->getMessage(),
                    'subject_percentages' => collect($validated['subjects'])->pluck('percentage'),
                    'difficulty_distribution' => $validated['difficulty_distribution']
                ]);
                return response()->json([
                    'status' => 'error',
                    'message' => 'Percentage Distribution Error',
                    'details' => $e->getMessage(),
                    'subject_total' => $totalSubjectPercentage,
                    'difficulty_total' => $totalDifficultyPercentage,
                    'code' => 'PERCENTAGE_ERROR',
                    'action' => 'Please ensure that all percentages add up to exactly 100%.'
                ], 422);
            }
            $formattedQuestions = [];
            $totalItems = $validated['total_items'];
            $questionsBySubject = [];
            foreach ($validated['subjects'] as $subjectData) {
                try {
                    $subject = Subject::find($subjectData['subjectID']);
                    if (!$subject) {
                        throw new \Exception("Subject not found with ID: {$subjectData['subjectID']}");
                    }
                    $subjectItemCount = round($totalItems * ($subjectData['percentage'] / 100));
                    Log::info('Processing subject:', [
                        'subject' => $subject->subjectName,
                        'itemCount' => $subjectItemCount,
                        'percentage' => $subjectData['percentage']
                    ]);
                    try {
                        $baseQuery = Question::with(['choices', 'difficulty', 'status', 'purpose'])
                            ->where('subjectID', $subjectData['subjectID'])
                            ->where('purpose_id', $purpose->id)
                            ->whereHas('status', function($query) {
                                $query->where('name', 'approved');
                            });
                        // Role-based filtering
                        if ($user->roleID === 2) { // Faculty/Instructor
                            $baseQuery->where('userID', $user->userID);
                        } elseif ($user->roleID === 3) { // Program Chair
                            $validUserIDs = User::where('programID', $user->programID)->pluck('userID');
                            $baseQuery->whereIn('userID', $validUserIDs);
                        } elseif ($user->roleID === 5) { // Associate Dean
                            $validUserIDs = User::where('campusID', $user->campusID)->pluck('userID');
                            $baseQuery->whereIn('userID', $validUserIDs);
                        } else if ($user->roleID === 4) {
                            // Dean: no additional filtering, can access all questions for the subject
                        }
                        $allQuestions = $baseQuery->get();
                        if ($allQuestions->isEmpty()) {
                            throw new \Exception("No questions found for subject: {$subject->subjectName}");
                        }
                    } catch (\Exception $e) {
                        Log::error('Question Query Error:', [
                            'subject' => $subject->subjectName,
                            'error' => $e->getMessage(),
                            'sql' => $baseQuery->toSql(),
                            'bindings' => $baseQuery->getBindings()
                        ]);
                        throw new \Exception("Failed to retrieve questions for {$subject->subjectName}: " . $e->getMessage());
                    }
                    try {
                        $easyQuestions = $allQuestions->filter(fn($q) => $q->difficulty && $q->difficulty->name === 'easy')->shuffle();
                        $moderateQuestions = $allQuestions->filter(fn($q) => $q->difficulty && $q->difficulty->name === 'moderate')->shuffle();
                        $hardQuestions = $allQuestions->filter(fn($q) => $q->difficulty && $q->difficulty->name === 'hard')->shuffle();
                        $numEasy = round($subjectItemCount * ($validated['difficulty_distribution']['easy'] / 100));
                        $numModerate = round($subjectItemCount * ($validated['difficulty_distribution']['moderate'] / 100));
                        $numHard = $subjectItemCount - ($numEasy + $numModerate);
                        $insufficientQuestions = [];
                        $totalAvailable = 0;
                        $totalRequired = 0;
                        if ($easyQuestions->count() < $numEasy) {
                            $insufficientQuestions[] = [
                                'difficulty' => 'Easy',
                                'required' => $numEasy,
                                'available' => $easyQuestions->count(),
                                'deficit' => $numEasy - $easyQuestions->count()
                            ];
                        }
                        if ($moderateQuestions->count() < $numModerate) {
                            $insufficientQuestions[] = [
                                'difficulty' => 'Moderate',
                                'required' => $numModerate,
                                'available' => $moderateQuestions->count(),
                                'deficit' => $numModerate - $moderateQuestions->count()
                            ];
                        }
                        if ($hardQuestions->count() < $numHard) {
                            $insufficientQuestions[] = [
                                'difficulty' => 'Hard',
                                'required' => $numHard,
                                'available' => $hardQuestions->count(),
                                'deficit' => $numHard - $hardQuestions->count()
                            ];
                        }
                        if (!empty($insufficientQuestions)) {
                            $totalAvailable = $easyQuestions->count() + $moderateQuestions->count() + $hardQuestions->count();
                            $totalRequired = $numEasy + $numModerate + $numHard;
                            $details = "Insufficient questions available for {$subject->subjectName}:\n";
                            foreach ($insufficientQuestions as $insufficient) {
                                $details .= "- {$insufficient['difficulty']}: Required {$insufficient['required']}, Available {$insufficient['available']} (Missing {$insufficient['deficit']})\n";
                            }
                            $suggestions = [];
                            if ($totalAvailable < $totalRequired) {
                                $suggestions[] = "Reduce the total number of questions for this subject";
                            }
                            if (!empty($insufficientQuestions)) {
                                $suggestions[] = "Adjust the difficulty distribution percentages";
                            }
                            $suggestions[] = "Add more questions to the question bank";
                            return response()->json([
                                'status' => 'error',
                                'message' => 'Insufficient Questions Available',
                                'details' => $details,
                                'code' => 'INSUFFICIENT_QUESTIONS',
                                'action' => 'Please try the following:\n' . implode('\n', $suggestions),
                                'insufficient_questions' => $insufficientQuestions,
                                'subject' => $subject->subjectName,
                                'total_required' => $totalRequired,
                                'total_available' => $totalAvailable,
                                'deficit' => $totalRequired - $totalAvailable,
                                'difficulty_distribution' => [
                                    'easy' => [
                                        'required' => $numEasy,
                                        'available' => $easyQuestions->count()
                                    ],
                                    'moderate' => [
                                        'required' => $numModerate,
                                        'available' => $moderateQuestions->count()
                                    ],
                                    'hard' => [
                                        'required' => $numHard,
                                        'available' => $hardQuestions->count()
                                    ]
                                ]
                            ], 422);
                        }
                        if ($easyQuestions->count() < $numEasy || 
                            $moderateQuestions->count() < $numModerate || 
                            $hardQuestions->count() < $numHard) {
                            throw new \Exception("Insufficient questions of required difficulty levels");
                        }
                        $selectedQuestions = collect()
                            ->merge($easyQuestions->take($numEasy))
                            ->merge($moderateQuestions->take($numModerate))
                            ->merge($hardQuestions->take($numHard))
                            ->shuffle();
                        $subjectQuestions = $this->formatQuestions($selectedQuestions, $subject);
                        if (empty($subjectQuestions)) {
                            throw new \Exception("Failed to format questions for subject");
                        }
                        $questionsBySubject[$subject->subjectName] = [
                            'subject' => $subject->subjectName,
                            'questions' => $subjectQuestions,
                            'totalItems' => count($subjectQuestions)
                        ];
                    } catch (\Exception $e) {
                        Log::error('Question Processing Error:', [
                            'subject' => $subject->subjectName,
                            'error' => $e->getMessage(),
                            'available_questions' => [
                                'easy' => $easyQuestions->count(),
                                'moderate' => $moderateQuestions->count(),
                                'hard' => $hardQuestions->count()
                            ],
                            'required_questions' => [
                                'easy' => $numEasy ?? 0,
                                'moderate' => $numModerate ?? 0,
                                'hard' => $numHard ?? 0
                            ]
                        ]);
                        throw $e;
                    }
                } catch (\Exception $e) {
                    Log::error('Subject Processing Error:', [
                        'subject_id' => $subjectData['subjectID'],
                        'error' => $e->getMessage(),
                        'trace' => $e->getTraceAsString()
                    ]);
                    return response()->json([
                        'status' => 'error',
                        'message' => "Error processing subject: " . ($subject ? $subject->subjectName : 'Unknown'),
                        'error' => $e->getMessage(),
                        'code' => 'SUBJECT_PROCESSING_ERROR'
                    ], 422);
                }
            }
            if (empty($questionsBySubject)) {
                throw new \Exception('No questions were successfully processed for any subject');
            }
            $leftLogoPath = public_path('storage/logo/JRMSU.jpg');
            $rightLogoPath = public_path('storage/logo/COE.jpg');
            $leftLogoBase64 = $this->getBase64Image($leftLogoPath);
            $rightLogoBase64 = $this->getBase64Image($rightLogoPath);
            if (!$leftLogoBase64 || !$rightLogoBase64) {
                $leftLogoBase64 = $this->getBase64Image(resource_path('assets/images/JRMSU.jpg'));
                $rightLogoBase64 = $this->getBase64Image(resource_path('assets/images/COE.jpg'));
            }
            if (!$leftLogoBase64 || !$rightLogoBase64) {
                Log::warning('Using default logos as custom logos not found');
                $leftLogoBase64 = $this->getBase64Image(resource_path('assets/images/default-left-logo.jpg'));
                $rightLogoBase64 = $this->getBase64Image(resource_path('assets/images/default-right-logo.jpg'));
            }
            $allQuestionsFlat = [];
            $allCorrectAnswers = [];
            foreach ($questionsBySubject as $subjectName => $subjectData) {
                foreach ($subjectData['questions'] as $q) {
                    $allQuestionsFlat[] = $q;
                }
            }
            shuffle($allQuestionsFlat);
            // Collect correct answers for all questions (flat)
            foreach ($allQuestionsFlat as $qIndex => $question) {
                $correctChoices = [];
                foreach ($question['choices'] as $choiceIndex => $choice) {
                    if ($choice['isCorrect']) {
                        $correctChoices[] = [
                            'choiceIndex' => $choiceIndex,
                            'choiceText' => $choice['choiceText'],
                            'choiceImage' => $choice['choiceImage'] ?? null
                        ];
                    }
                }
                $allCorrectAnswers[$qIndex] = $correctChoices;
            }
            $previewData = [
                'questions' => $allQuestionsFlat,
                'totalItems' => count($allQuestionsFlat),
                'requestedItems' => $totalItems,
                'purpose' => $validated['purpose'],
                'examTitle' => match($validated['purpose']) {
                    'examQuestions' => 'Qualifying Examination',
                    'practiceQuestions' => 'Practice Examination',
                    'personalQuestions' => 'Quiz',
                    default => 'Multi-Subject Questions'
                },
                'logos' => [
                    'left' => $leftLogoBase64,
                    'right' => $rightLogoBase64
                ],
                'timestamp' => now()->timestamp,
                'user_id' => Auth::id(),
                'correctAnswers' => $allCorrectAnswers
            ];
            $previewKey = 'exam_preview_' . Auth::id() . '_' . now()->timestamp;
            session([$previewKey => $previewData]);
            Cache::put($previewKey, $previewData, $this->sessionLifetime);
            session()->save();
            Log::info('Preview data stored:', [
                'previewKey' => $previewKey,
                'session_id' => session()->getId(),
                'data_size' => strlen(json_encode($previewData)),
                'user_id' => Auth::id(),
                'timestamp' => now()->timestamp
            ]);
            return response()->json([
                'previewData' => $previewData,
                'previewKey' => $previewKey
            ]);
        } catch (\Exception $e) {
            Log::error('Multi-Subject Exam Print Error:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request' => $request->all()
            ]);
            return response()->json([
                'status' => 'error',
                'message' => 'System Error',
                'details' => 'An unexpected error occurred while processing your request.',
                'code' => 'SYSTEM_ERROR',
                'action' => 'Please try again later. If the problem persists, contact system administrator.'
            ], 500);
        }
    }

    /**
     * Generate a single-subject personal questions preview (JSON only)
     */
    public function generateSingleSubjectPersonalPreview(Request $request)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                throw new \Exception('User not authenticated');
            }
            // Validate input
            $validated = $request->validate([
                'subjectID' => 'required|exists:subjects,subjectID',
                'total_items' => 'required|integer|min:1',
                'difficulty_distribution' => 'required|array',
                'difficulty_distribution.easy' => 'required|integer|min:0|max:100',
                'difficulty_distribution.moderate' => 'required|integer|min:0|max:100',
                'difficulty_distribution.hard' => 'required|integer|min:0|max:100',
            ]);
            $purpose = \Modules\Questions\Models\Purpose::where('name', 'personalQuestions')->first();
            if (!$purpose) {
                throw new \Exception('personalQuestions purpose not found in database');
            }
            $subject = Subject::find($validated['subjectID']);
            if (!$subject) {
                throw new \Exception('Subject not found');
            }
            $baseQuery = Question::with(['choices', 'difficulty', 'status', 'purpose'])
                ->where('subjectID', $validated['subjectID'])
                ->where('purpose_id', $purpose->id)
                ->where('userID', $user->userID)
                ->whereHas('status', function($query) {
                    $query->where('name', 'approved');
                });
            $allQuestions = $baseQuery->get();
            if ($allQuestions->isEmpty()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'No personal questions found for this subject',
                    'code' => 'NO_QUESTIONS'
                ], 422);
            }
            $totalItems = $validated['total_items'];
            $numEasy = round($totalItems * ($validated['difficulty_distribution']['easy'] / 100));
            $numModerate = round($totalItems * ($validated['difficulty_distribution']['moderate'] / 100));
            $numHard = $totalItems - ($numEasy + $numModerate);
            $easyQuestions = $allQuestions->filter(fn($q) => $q->difficulty && $q->difficulty->name === 'easy')->shuffle();
            $moderateQuestions = $allQuestions->filter(fn($q) => $q->difficulty && $q->difficulty->name === 'moderate')->shuffle();
            $hardQuestions = $allQuestions->filter(fn($q) => $q->difficulty && $q->difficulty->name === 'hard')->shuffle();
            $insufficientQuestions = [];
            if ($easyQuestions->count() < $numEasy) {
                $insufficientQuestions[] = [
                    'difficulty' => 'Easy',
                    'required' => $numEasy,
                    'available' => $easyQuestions->count(),
                    'deficit' => $numEasy - $easyQuestions->count()
                ];
            }
            if ($moderateQuestions->count() < $numModerate) {
                $insufficientQuestions[] = [
                    'difficulty' => 'Moderate',
                    'required' => $numModerate,
                    'available' => $moderateQuestions->count(),
                    'deficit' => $numModerate - $moderateQuestions->count()
                ];
            }
            if ($hardQuestions->count() < $numHard) {
                $insufficientQuestions[] = [
                    'difficulty' => 'Hard',
                    'required' => $numHard,
                    'available' => $hardQuestions->count(),
                    'deficit' => $numHard - $hardQuestions->count()
                ];
            }
            if (!empty($insufficientQuestions)) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Insufficient Questions Available',
                    'details' => $insufficientQuestions,
                    'code' => 'INSUFFICIENT_QUESTIONS',
                ], 422);
            }
            $selectedQuestions = collect()
                ->merge($easyQuestions->take($numEasy))
                ->merge($moderateQuestions->take($numModerate))
                ->merge($hardQuestions->take($numHard))
                ->shuffle();
            $subjectQuestions = $this->formatQuestions($selectedQuestions, $subject);
            $correctAnswers = [];
            foreach ($subjectQuestions as $qIndex => $question) {
                $correctChoices = [];
                foreach ($question['choices'] as $choiceIndex => $choice) {
                    if ($choice['isCorrect']) {
                        $correctChoices[] = [
                            'choiceIndex' => $choiceIndex,
                            'choiceText' => $choice['choiceText'],
                            'choiceImage' => $choice['choiceImage'] ?? null
                        ];
                    }
                }
                $correctAnswers[$qIndex] = $correctChoices;
            }
            $previewData = [
                'subject' => $subject->subjectName,
                'questions' => $subjectQuestions,
                'totalItems' => count($subjectQuestions),
                'requestedItems' => $totalItems,
                'purpose' => 'personalQuestions',
                'examTitle' => 'Quiz',
                'timestamp' => now()->timestamp,
                'user_id' => Auth::id(),
                'correctAnswers' => $correctAnswers
            ];
            return response()->json([
                'previewData' => $previewData
            ]);
        } catch (\Exception $e) {
            Log::error('Single-Subject Personal Preview Error:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request' => $request->all()
            ]);
            return response()->json([   
                'status' => 'error',
                'message' => 'System Error',
                'details' => 'An unexpected error occurred while processing your request.',
                'code' => 'SYSTEM_ERROR',
                'action' => 'Please try again later. If the problem persists, contact system administrator.'
            ], 500);
        }
    }
}
