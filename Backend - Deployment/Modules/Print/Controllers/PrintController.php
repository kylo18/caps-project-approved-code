<?php

namespace Modules\Print\Controllers;

use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Log;
use Modules\Questions\Models\Question;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Modules\Subjects\Models\Subject;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use Barryvdh\DomPDF\Facade\Pdf;
use Modules\Users\Models\User;
use Modules\Questions\Models\Status;
use Illuminate\Support\Str;

class PrintController extends Controller
{
    private function generateUrl($path)
    {
        if (!$path) {
            return null;
        }

        // If it's already a full URL, return as is
        if (Str::startsWith($path, ['http://', 'https://'])) {
            return $path;
        }

        // Check if the file exists in storage
        if (!Storage::disk('public')->exists($path)) {
            return null;
        }

        // Generate the full URL for the existing file
        return asset('storage/' . $path);
    }

    private function formatQuestions($questions, $subject = null)
    {
        try {
            $formattedQuestions = [];
            foreach ($questions as $q) {
                try {
                    $questionText = Crypt::decryptString($q->questionText);
                    $choices = $q->choices->map(function ($choice) {
                        try {
                            return [
                                'choiceText' => $choice->choiceText ? Crypt::decryptString($choice->choiceText) : null,
                                'choiceImage' => $this->generateUrl($choice->image),
                            ];
                        } catch (\Exception $e) {
                            Log::error('Choice formatting failed:', [
                                'choiceID' => $choice->choiceID,
                                'error' => $e->getMessage()
                            ]);
                            return null;
                        }
                    })->filter();

                    $formattedQuestions[] = [
                        'questionText' => $questionText,
                        'questionImage' => $this->generateUrl($q->image),
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
            return $formattedQuestions;
        } catch (\Exception $e) {
            Log::error('Questions formatting failed:', [
                'error' => $e->getMessage()
            ]);
            return [];
        }
    }

    public function generatePrintableExam(Request $request, $subjectID)
    {
        try {
            $user = Auth::user();
            if (!in_array($user->roleID, [2, 3, 4])) {
                return response()->json(['message' => 'Unauthorized.'], 403);
            }

            $subject = Subject::find($subjectID);
            if (!$subject) {
                return response()->json(['message' => 'Subject not found.'], 404);
            }

            $coverage = $request->input('coverage', 'full');
            $limit = (int) $request->input('limit', 10);
            $easy = (int) $request->input('easy_percentage', 30);
            $moderate = (int) $request->input('moderate_percentage', 50);
            $hard = 100 - ($easy + $moderate);

            if ($limit <= 0) {
                return response()->json(['message' => 'Item count must be greater than 0.'], 422);
            }

            $baseQuery = Question::with('choices')
                ->where('subjectID', $subjectID)
                ->whereHas('status', function($query) {
                    $query->where('name', 'approved');
                })
                ->where('purpose', 'examQuestions');

            if (in_array($coverage, ['midterm', 'final'])) {
                $baseQuery->where('coverage', $coverage);
            }

            if ($user->roleID === 2) {
                $assignedSubjectIDs = $user->subjects()->pluck('subjects.subjectID')->toArray();
                if (!in_array($subjectID, $assignedSubjectIDs)) {
                    return response()->json(['message' => 'You are not assigned to this subject.'], 403);
                }
                $baseQuery->where('userID', $user->userID);
            } elseif ($user->roleID === 3) {
                $validUserIDs = User::whereIn('programID', [$user->programID, 6])->pluck('userID');
                $baseQuery->whereIn('userID', $validUserIDs);
            }

            $allQuestions = $baseQuery->get();
            if ($allQuestions->isEmpty()) {
                return response()->json(['message' => 'No questions available.'], 404);
            }

            $easyQuestions = $allQuestions->where('difficulty', 'easy')->shuffle();
            $moderateQuestions = $allQuestions->where('difficulty', 'moderate')->shuffle();
            $hardQuestions = $allQuestions->where('difficulty', 'hard')->shuffle();

            $numEasy = round($limit * ($easy / 100));
            $numModerate = round($limit * ($moderate / 100));
            $numHard = $limit - ($numEasy + $numModerate);

            $finalQuestions = collect()
                ->merge($easyQuestions->take($numEasy))
                ->merge($moderateQuestions->take($numModerate))
                ->merge($hardQuestions->take($numHard))
                ->shuffle();

            $formattedQuestions = [];

            foreach ($finalQuestions as $q) {
                try {
                    $questionText = Crypt::decryptString($q->questionText);
                } catch (\Exception $e) {
                    Log::error("Decrypt fail Q{$q->questionID}: {$e->getMessage()}");
                    continue;
                }

                $shuffledChoices = $q->choices->shuffle();
                $correctChoice = $shuffledChoices->firstWhere('isCorrect', true);

                if (!$correctChoice) {
                    continue; // Skip if no correct choice exists
                }

                $selectedChoices = collect([$correctChoice]);
                $otherChoices = $shuffledChoices->filter(fn($c) => $c->choiceID !== $correctChoice->choiceID)->take(3);
                $selectedChoices = $selectedChoices->merge($otherChoices)->shuffle();

                $choices = $selectedChoices->map(function ($choice) {
                    try {
                        $text = $choice->choiceText ? Crypt::decryptString($choice->choiceText) : null;
                    } catch (\Exception $e) {
                        $text = null;
                    }
                    return [
                        'choiceText' => $text,
                        'choiceImage' => $this->generateUrl($choice->image),
                    ];
                });

                $formattedQuestions[] = [
                    'questionText' => $questionText,
                    'questionImage' => $this->generateUrl($q->image),
                    'choices' => $choices,
                    'score' => $q->score,
                ];
            }

            if (empty($formattedQuestions)) {
                return response()->json(['message' => 'Failed to retrieve valid questions.'], 422);
            }
            $formattedQuestions = array_values($formattedQuestions);
            $pdf = PDF::loadView('exams.printable', [
                'formattedQuestions' => $formattedQuestions,
                'subjectName' => $subject->subjectName,
            ]);

            $pdf->setOptions([
                'isRemoteEnabled' => true,
            ]);
            return $pdf->download("exam_{$subject->subjectCode}.pdf");
        } catch (\Exception $e) {
            Log::error('Exam Print Error: ' . $e->getMessage());
            return response()->json(['message' => 'Server error.', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Generate a multi-subject examination with customizable distribution of questions
     * This function supports both qualifying and regular exams with configurable subject and difficulty distributions
     * 
     * @param Request $request The HTTP request containing exam configuration
     * @return \Illuminate\Http\Response Returns either a PDF download or JSON preview
     */
    public function generateMultiSubjectExam(Request $request)
    {
        try {
            // Log incoming request for debugging
            Log::info('Multi-Subject Exam Request:', [
                'request_data' => $request->all(),
                'user_id' => Auth::id()
            ]);

            try {
                $user = Auth::user();
                if (!$user) {
                    throw new \Exception('User not authenticated');
                }
                if (!in_array($user->roleID, [3, 4])) {
                    throw new \Exception('User role not authorized. Role ID: ' . $user->roleID);
                }
            } catch (\Exception $e) {
                Log::error('Authentication Error:', [
                    'error' => $e->getMessage(),
                    'user' => Auth::id() ?? 'none'
                ]);
                return response()->json(['message' => 'Unauthorized. Only Program Chair and Dean can generate multi-subject exams.'], 403);
            }

            // Force the purpose to be examQuestions
            $request->merge(['purpose' => 'examQuestions']);

            try {
                // Validate all required input parameters
                $validated = $request->validate([
                    'total_items' => 'required|integer|min:1',
                    'subjects' => 'required|array|min:1',
                    'subjects.*.subjectID' => 'required|exists:subjects,subjectID',
                    'subjects.*.percentage' => 'required|integer|min:1|max:100',
                    'difficulty_distribution' => 'required|array',
                    'difficulty_distribution.easy' => 'required|integer|min:0|max:100',
                    'difficulty_distribution.moderate' => 'required|integer|min:0|max:100',
                    'difficulty_distribution.hard' => 'required|integer|min:0|max:100',
                    'preview' => 'boolean'
                ]);
            } catch (\Illuminate\Validation\ValidationException $e) {
                Log::error('Validation Error:', [
                    'errors' => $e->errors(),
                    'request_data' => $request->all()
                ]);
                throw $e;
            }

            // Add purpose to validated data
            $validated['purpose'] = 'examQuestions';

            try {
                // Get the examQuestions purpose
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
                    'message' => 'System configuration error: examQuestions purpose not found.',
                    'error_details' => $e->getMessage()
                ], 500);
            }

            // Validate percentages
            try {
                // Ensure subject percentages sum to exactly 100%
                $totalSubjectPercentage = collect($validated['subjects'])->sum('percentage');
                if ($totalSubjectPercentage !== 100) {
                    throw new \Exception("Subject percentages sum to {$totalSubjectPercentage}%, expected 100%");
                }

                // Ensure difficulty distribution percentages sum to exactly 100%
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
                    'message' => $e->getMessage(),
                    'subject_total' => $totalSubjectPercentage,
                    'difficulty_total' => $totalDifficultyPercentage
                ], 422);
            }

            $formattedQuestions = [];
            $totalItems = $validated['total_items'];
            $questionsBySubject = [];
            
            // Process each subject
            foreach ($validated['subjects'] as $subjectData) {
                try {
                    $subject = Subject::find($subjectData['subjectID']);
                    if (!$subject) {
                        throw new \Exception("Subject not found with ID: {$subjectData['subjectID']}");
                    }

                    // Calculate how many questions to get from this subject
                    $subjectItemCount = round($totalItems * ($subjectData['percentage'] / 100));
                    
                    Log::info('Processing subject:', [
                        'subject' => $subject->subjectName,
                        'itemCount' => $subjectItemCount,
                        'percentage' => $subjectData['percentage']
                    ]);

                    // Build and execute query
                    try {
                        $baseQuery = Question::with(['choices', 'difficulty', 'status', 'purpose'])
                            ->where('subjectID', $subjectData['subjectID'])
                            ->where('purpose_id', $purpose->id)
                            ->whereHas('status', function($query) {
                                $query->where('name', 'approved');
                            });

                        if ($user->roleID === 3) {
                            $validUserIDs = User::whereIn('programID', [$user->programID, 6])->pluck('userID');
                            $baseQuery->whereIn('userID', $validUserIDs);
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

                    // Process questions by difficulty
                    try {
                        $easyQuestions = $allQuestions->filter(fn($q) => $q->difficulty && $q->difficulty->name === 'easy')->shuffle();
                        $moderateQuestions = $allQuestions->filter(fn($q) => $q->difficulty && $q->difficulty->name === 'moderate')->shuffle();
                        $hardQuestions = $allQuestions->filter(fn($q) => $q->difficulty && $q->difficulty->name === 'hard')->shuffle();

                        $numEasy = round($subjectItemCount * ($validated['difficulty_distribution']['easy'] / 100));
                        $numModerate = round($subjectItemCount * ($validated['difficulty_distribution']['moderate'] / 100));
                        $numHard = $subjectItemCount - ($numEasy + $numModerate);

                        // Validate question counts
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
                        'message' => "Error processing subject: " . ($subject ? $subject->subjectName : 'Unknown'),
                        'error' => $e->getMessage()
                    ], 422);
                }
            }

            if (empty($questionsBySubject)) {
                throw new \Exception('No questions were successfully processed for any subject');
            }

            // Handle preview request
            if ($request->input('preview', false)) {
                $previewData = [
                    'questionsBySubject' => $questionsBySubject,
                    'totalItems' => array_sum(array_map(fn($subject) => $subject['totalItems'], $questionsBySubject)),
                    'requestedItems' => $totalItems,
                    'purpose' => $validated['purpose'],
                    'examTitle' => match($validated['purpose']) {
                        'examQuestions' => 'Qualifying Examination',
                        'practiceQuestions' => 'Practice Questions',
                        'personalQuestions' => 'Personal Questions',
                        default => 'Multi-Subject Questions'
                    },
                    'logos' => [
                        'left' => asset('storage/logo/JRMSU.jpg'),
                        'right' => asset('storage/logo/COE.jpg')
                    ]
                ];

                // Store preview data in session
                session(['exam_preview_data' => $previewData]);

                return response()->json($previewData);
            }

            // For download request, use the stored preview data if it exists
            $storedPreviewData = session('exam_preview_data');
            if ($storedPreviewData) {
                $questionsBySubject = $storedPreviewData['questionsBySubject'];
                $examTitle = $storedPreviewData['examTitle'];
                $leftLogoUrl = $storedPreviewData['logos']['left'];
                $rightLogoUrl = $storedPreviewData['logos']['right'];
            } else {
                // If no stored data (direct download without preview), generate exam title and logos
                $examTitle = match($validated['purpose']) {
                    'examQuestions' => 'Qualifying Examination',
                    'practiceQuestions' => 'Practice Questions',
                    'personalQuestions' => 'Personal Questions',
                    default => 'Multi-Subject Questions'
                };

                $leftLogoPath = storage_path('app/public/logo/JRMSU.jpg');
                $rightLogoPath = storage_path('app/public/logo/COE.jpg');

                $leftLogoUrl = 'data:image/jpeg;base64,' . base64_encode(file_get_contents($leftLogoPath));
                $rightLogoUrl = 'data:image/jpeg;base64,' . base64_encode(file_get_contents($rightLogoPath));
            }

            // Generate PDF
            try {
                // Increase execution time and memory limits
                ini_set('max_execution_time', '600'); // 10 minutes
                ini_set('memory_limit', '1G'); // Increase memory limit
                gc_enable(); // Enable garbage collection

                // Configure PDF with optimized settings
                $pdf = PDF::loadView('exams.printable', [
                    'questionsBySubject' => $questionsBySubject,
                    'examTitle' => $examTitle,
                    'leftLogoPath' => $leftLogoUrl,
                    'rightLogoPath' => $rightLogoUrl
                ]);

                $pdfOptions = [
                    'isRemoteEnabled' => true,
                    'isPhpEnabled' => true,
                    'isHtml5ParserEnabled' => true,
                    'dpi' => 96, // Reduced DPI for better performance
                    'defaultFont' => 'times',
                    'chroot' => [
                        public_path('storage'),
                        public_path(),
                        storage_path('app/public')
                    ],
                    'enable_remote' => true,
                    'enable_php' => true,
                    'enable_javascript' => false,
                    'images' => true,
                    'enable_html5_parser' => true,
                    'debugPng' => false,
                    'debugKeepTemp' => false,
                    'logOutputFile' => storage_path('logs/pdf.log'),
                    'fontCache' => storage_path('fonts'),
                    'tempDir' => storage_path('app/temp'),
                    'image_cache_enabled' => false, // Disable image caching for now
                    'defaultMediaType' => 'print',
                    'defaultPaperSize' => 'a4',
                    'fontHeightRatio' => 1,
                    'isFontSubsettingEnabled' => true
                ];

                $pdf->setOptions($pdfOptions);
                $pdf->setPaper('A4', 'portrait');

                // Process images with size limits
                foreach ($questionsBySubject as &$subjectData) {
                    foreach ($subjectData['questions'] as &$question) {
                        if (!empty($question['questionImage'])) {
                            $question['questionImage'] = $this->optimizeImage($question['questionImage']);
                        }
                        if (!empty($question['choices'])) {
                            foreach ($question['choices'] as &$choice) {
                                if (!empty($choice['choiceImage'])) {
                                    $choice['choiceImage'] = $this->optimizeImage($choice['choiceImage']);
                                }
                            }
                        }
                        // Clear memory after processing each question
                        gc_collect_cycles();
                    }
                }

                // Generate and save PDF
                $tempPath = storage_path('app/temp-' . Str::random(16) . '.pdf');
                
                try {
                    // Clear temporary files
                    $this->clearTempFiles();
                    
                    // Generate PDF in chunks if needed
                    $pdf->save($tempPath);

                    if (!file_exists($tempPath)) {
                        throw new \Exception("Failed to generate PDF file");
                    }

                    // Set headers for immediate download
                    $headers = [
                        'Content-Type' => 'application/pdf',
                        'Content-Disposition' => 'attachment; filename="exam.pdf"',
                        'Cache-Control' => 'no-cache, private',
                        'Pragma' => 'no-cache',
                    ];

                    return response()->file($tempPath, $headers)->deleteFileAfterSend(true);

                } catch (\Exception $e) {
                    if (file_exists($tempPath)) {
                        unlink($tempPath);
                    }
                    throw $e;
                }

            } catch (\Exception $e) {
                Log::error('PDF Generation Error:', [
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString()
                ]);
                
                return response()->json([
                    'message' => 'Failed to generate PDF.',
                    'error' => $e->getMessage()
                ], 500);
            }

        } catch (\Exception $e) {
            Log::error('Multi-Subject Exam Print Error:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request' => $request->all()
            ]);
            return response()->json([
                'message' => 'Server error.',
                'error' => $e->getMessage(),
                'details' => 'An unexpected error occurred while generating the exam.'
            ], 500);
        }
    }

    /**
     * Clear temporary PDF files
     */
    private function clearTempFiles()
    {
        $tempDir = storage_path('app/temp');
        if (is_dir($tempDir)) {
            $files = glob($tempDir . '/temp-*.pdf');
            foreach ($files as $file) {
                if (is_file($file) && time() - filemtime($file) > 3600) { // Remove files older than 1 hour
                    unlink($file);
                }
            }
        }
    }

    /**
     * Optimize image for PDF
     */
    private function optimizeImage($imageUrl)
    {
        try {
            if (empty($imageUrl)) return null;

            // Get image content
            $imageContent = null;
            $maxWidth = 800; // Maximum width in pixels
            $maxHeight = 600; // Maximum height in pixels
            $quality = 80; // JPEG quality

            if (filter_var($imageUrl, FILTER_VALIDATE_URL)) {
                // For external URLs
                $imageContent = file_get_contents($imageUrl);
            } else {
                // For local storage files
                $path = str_replace('/storage/', '', parse_url($imageUrl, PHP_URL_PATH));
                if (Storage::disk('public')->exists($path)) {
                    $imageContent = Storage::disk('public')->get($path);
                }
            }

            if (!$imageContent) {
                return null;
            }

            // Create image resource
            $image = imagecreatefromstring($imageContent);
            if (!$image) {
                return $imageUrl;
            }

            // Get original dimensions
            $width = imagesx($image);
            $height = imagesy($image);

            // Calculate new dimensions
            if ($width > $maxWidth || $height > $maxHeight) {
                $ratio = min($maxWidth / $width, $maxHeight / $height);
                $newWidth = round($width * $ratio);
                $newHeight = round($height * $ratio);

                // Create new image
                $newImage = imagecreatetruecolor($newWidth, $newHeight);
                imagecopyresampled($newImage, $image, 0, 0, 0, 0, $newWidth, $newHeight, $width, $height);
                
                // Free up memory
                imagedestroy($image);
                $image = $newImage;
            }

            // Output optimized image
            ob_start();
            imagejpeg($image, null, $quality);
            $optimizedContent = ob_get_clean();
            imagedestroy($image);

            // Create temporary file
            $tempFile = tempnam(sys_get_temp_dir(), 'pdf_img_');
            file_put_contents($tempFile, $optimizedContent);

            return $tempFile;
        } catch (\Exception $e) {
            Log::error('Image optimization failed:', [
                'url' => $imageUrl,
                'error' => $e->getMessage()
            ]);
            return $imageUrl;
        }
    }
}
