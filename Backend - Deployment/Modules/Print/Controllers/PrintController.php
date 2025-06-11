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
                    
                    // Handle question image
                    $questionImage = null;
                    if ($q->image) {
                        if (filter_var($q->image, FILTER_VALIDATE_URL)) {
                            $questionImage = $q->image;
                        } elseif (Storage::disk('public')->exists($q->image)) {
                            $questionImage = asset('storage/' . $q->image);
                        }
                    }

                    // Format choices with proper image handling
                    $choices = $q->choices->map(function ($choice) {
                        try {
                            $choiceText = $choice->choiceText ? Crypt::decryptString($choice->choiceText) : null;
                            
                            // Handle choice image
                            $choiceImage = null;
                            if ($choice->image) {
                                if (filter_var($choice->image, FILTER_VALIDATE_URL)) {
                                    $choiceImage = $choice->image;
                                } elseif (Storage::disk('public')->exists($choice->image)) {
                                    $choiceImage = asset('storage/' . $choice->image);
                                }
                            }

                            return [
                                'choiceText' => $choiceText,
                                'choiceImage' => $choiceImage,
                                'position' => $choice->position
                            ];
                        } catch (\Exception $e) {
                            Log::error('Choice formatting failed:', [
                                'choiceID' => $choice->choiceID,
                                'error' => $e->getMessage()
                            ]);
                            return null;
                        }
                    })->filter()->sortBy('position')->values();

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
                $imageData = file_get_contents($path);
                return 'data:image/jpeg;base64,' . base64_encode($imageData);
            }
            // Try alternative path if first path doesn't exist
            $altPath = resource_path('assets/images/' . basename($path));
            if (file_exists($altPath)) {
                $imageData = file_get_contents($altPath);
                return 'data:image/jpeg;base64,' . base64_encode($imageData);
            }
            Log::warning('Logo file not found:', ['path' => $path, 'altPath' => $altPath]);
            return null;
        } catch (\Exception $e) {
            Log::error('Error reading image:', ['path' => $path, 'error' => $e->getMessage()]);
            return null;
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
                return response()->json(['message' => 'Unauthorized. Only Program Chair and Dean can generate multi-subject exams.'], 401);
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
                return response()->json(['message' => 'Validation failed', 'errors' => $e->errors()], 422);
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

            // Get base64 encoded logos
            $leftLogoPath = public_path('storage/logo/JRMSU.jpg');
            $rightLogoPath = public_path('storage/logo/COE.jpg');
            
            $leftLogoBase64 = $this->getBase64Image($leftLogoPath);
            $rightLogoBase64 = $this->getBase64Image($rightLogoPath);

            // If logos are not found in public storage, try resource path
            if (!$leftLogoBase64 || !$rightLogoBase64) {
                $leftLogoBase64 = $this->getBase64Image(resource_path('assets/images/JRMSU.jpg'));
                $rightLogoBase64 = $this->getBase64Image(resource_path('assets/images/COE.jpg'));
            }

            // If still not found, use default logos
            if (!$leftLogoBase64 || !$rightLogoBase64) {
                Log::warning('Using default logos as custom logos not found');
                $leftLogoBase64 = $this->getBase64Image(resource_path('assets/images/default-left-logo.jpg'));
                $rightLogoBase64 = $this->getBase64Image(resource_path('assets/images/default-right-logo.jpg'));
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
                        'left' => $leftLogoBase64,
                        'right' => $rightLogoBase64
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

                $leftLogoUrl = $leftLogoBase64;
                $rightLogoUrl = $rightLogoBase64;
            }

            // Generate PDF
            try {
                // Increase execution time and memory limits
                ini_set('max_execution_time', '600'); // 10 minutes
                ini_set('memory_limit', '2G'); // Increase memory limit to 2GB
                gc_enable(); // Enable garbage collection

                // Configure PDF with optimized settings
                $pdf = PDF::loadView('exams.printable', [
                    'questionsBySubject' => $questionsBySubject,
                    'examTitle' => $examTitle,
                    'leftLogoPath' => $leftLogoUrl,
                    'rightLogoPath' => $rightLogoUrl
                ]);

                $pdfOptions = [
                    'isRemoteEnabled' => false, // Disable remote resources
                    'isPhpEnabled' => true,
                    'isHtml5ParserEnabled' => true,
                    'dpi' => 72, // Reduced DPI for better performance
                    'defaultFont' => 'times',
                    'chroot' => [
                        public_path('storage'),
                        public_path(),
                        storage_path('app/public')
                    ],
                    'enable_remote' => false, // Disable remote resources
                    'enable_php' => true,
                    'enable_javascript' => false,
                    'images' => true,
                    'enable_html5_parser' => true,
                    'debugPng' => false,
                    'debugKeepTemp' => false,
                    'logOutputFile' => storage_path('logs/pdf.log'),
                    'fontCache' => storage_path('fonts'),
                    'tempDir' => storage_path('app/temp'),
                    'image_cache_enabled' => true,
                    'defaultMediaType' => 'print',
                    'defaultPaperSize' => 'a4',
                    'fontHeightRatio' => 1,
                    'isFontSubsettingEnabled' => true
                ];

                $pdf->setOptions($pdfOptions);
                $pdf->setPaper('A4', 'portrait');

                // Generate and save PDF
                $tempPath = storage_path('app/temp-' . Str::random(16) . '.pdf');
                
                try {
                    // Clear temporary files
                    $this->clearTempFiles();
                    
                    // Generate PDF
                    $pdf->save($tempPath);

                    if (!file_exists($tempPath)) {
                        throw new \Exception("Failed to generate PDF file");
                    }

                    // Generate a unique filename
                    $filename = 'exam_' . date('Y-m-d_H-i-s') . '.pdf';

                    // Set headers for immediate download
                    $headers = [
                        'Content-Type' => 'application/pdf',
                        'Content-Disposition' => 'attachment; filename="' . $filename . '"',
                        'Cache-Control' => 'no-cache, private',
                        'Pragma' => 'no-cache',
                        'Content-Length' => filesize($tempPath),
                        'Access-Control-Expose-Headers' => 'Content-Disposition'
                    ];

                    // Return the file response
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
                    'trace' => $e->getTraceAsString(),
                    'memory_usage' => memory_get_usage(true),
                    'peak_memory_usage' => memory_get_peak_usage(true)
                ]);
                
                return response()->json([
                    'message' => 'Failed to generate PDF.',
                    'error' => $e->getMessage(),
                    'details' => 'An error occurred while generating the PDF. Please try again with fewer questions or images.'
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

            $imageContent = null;
            $maxWidth = 800; // Maximum width in pixels
            $maxHeight = 600; // Maximum height in pixels
            $quality = 80; // JPEG quality

            if (filter_var($imageUrl, FILTER_VALIDATE_URL)) {
                // For external URLs
                $imageContent = @file_get_contents($imageUrl);
            } else {
                // For local storage files
                $path = str_replace('/storage/', '', parse_url($imageUrl, PHP_URL_PATH));
                if (\Illuminate\Support\Facades\Storage::disk('public')->exists($path)) {
                    $imageContent = \Illuminate\Support\Facades\Storage::disk('public')->get($path);
                }
            }

            if (!$imageContent) {
                return null;
            }

            // Create image resource
            $image = @imagecreatefromstring($imageContent);
            if (!$image) {
                return $imageUrl;
            }

            $width = imagesx($image);
            $height = imagesy($image);

            if ($width > $maxWidth || $height > $maxHeight) {
                $ratio = min($maxWidth / $width, $maxHeight / $height);
                $newWidth = round($width * $ratio);
                $newHeight = round($height * $ratio);

                $newImage = imagecreatetruecolor($newWidth, $newHeight);
                imagecopyresampled($newImage, $image, 0, 0, 0, 0, $newWidth, $newHeight, $width, $height);
                imagedestroy($image);
                $image = $newImage;
            }

            ob_start();
            imagejpeg($image, null, $quality);
            $optimizedContent = ob_get_clean();
            imagedestroy($image);

            // Convert to base64 data URI
            $base64 = base64_encode($optimizedContent);
            return 'data:image/jpeg;base64,' . $base64;
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Image optimization failed:', [
                'url' => $imageUrl,
                'error' => $e->getMessage()
            ]);
            return $imageUrl;
        }
    }
}
