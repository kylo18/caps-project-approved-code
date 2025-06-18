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
use Illuminate\Support\Facades\Cache;

class PrintController extends Controller
{
    private $sessionLifetime = 3600; // 1 hour in seconds
    private $pdfStoragePath = 'app/public/generated-exams'; // Path for storing generated PDFs

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
                        // Handle the specific question_images path
                        $imagePath = 'question_images/' . basename($q->image);
                        if (file_exists(public_path('storage/' . $imagePath))) {
                            $questionImage = asset('storage/' . $imagePath);
                        }
                    }

                    // Format choices with proper image handling
                    $choices = [];
                    $regularChoices = [];
                    $noneChoice = null;

                    foreach ($q->choices as $choice) {
                        try {
                            $choiceText = $choice->choiceText ? Crypt::decryptString($choice->choiceText) : null;
                            $choiceImage = null;
                            
                            if ($choice->image) {
                                // Handle the specific choices path
                                $imagePath = 'choices/' . basename($choice->image);
                                if (file_exists(public_path('storage/' . $imagePath))) {
                                    $choiceImage = asset('storage/' . $imagePath);
                                }
                            }

                            $formattedChoice = [
                                'choiceText' => $choiceText,
                                'choiceImage' => $choiceImage,
                                'isCorrect' => $choice->isCorrect
                            ];

                            // Separate regular choices from "None of the above"
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

                    // Shuffle regular choices (A-D)
                    shuffle($regularChoices);

                    // Combine shuffled regular choices with "None of the above" at the end
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

            // Shuffle the questions
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
            // Try alternative path if first path doesn't exist
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
     * Generate a multi-subject examination with customizable distribution of questions
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
                    'difficulty_distribution.hard' => 'required|integer|min:0|max:100'
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
                    'status' => 'error',
                    'message' => 'System Configuration Error',
                    'details' => 'Unable to process exam generation. The system is not properly configured.',
                    'code' => 'CONFIG_ERROR',
                    'action' => 'Please contact system administrator to resolve this issue.'
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

                        // Check for insufficient questions
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

            // Prepare the data for PDF generation
            $examData = [
                'questionsBySubject' => $questionsBySubject,
                'totalItems' => array_sum(array_map(fn($subject) => $subject['totalItems'], $questionsBySubject)),
                'requestedItems' => $totalItems,
                'purpose' => $validated['purpose'],
                'examTitle' => 'Qualifying Examination',
                'logos' => [
                    'left' => $leftLogoBase64,
                    'right' => $rightLogoBase64
                ],
                'timestamp' => now()->timestamp,
                'user_id' => Auth::id()
            ];

            // Generate a unique job ID
            $jobId = Str::uuid()->toString();
            
            // Store the job data in cache
            Cache::put('pdf_generation_' . $jobId, [
                'status' => 'pending',
                'user_id' => Auth::id(),
                'exam_data' => $examData,
                'created_at' => now()->timestamp
            ], 3600); // Store for 1 hour

            // Dispatch the PDF generation job
            \Modules\Print\Jobs\GenerateExamPDF::dispatch($jobId, $examData)
                ->onQueue('pdf-generation')
                ->delay(now()->addSeconds(2));

            return response()->json([
                'status' => 'success',
                'message' => 'PDF generation started',
                'jobId' => $jobId,
                'pollUrl' => route('api.print.check-status', ['jobId' => $jobId])
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
     * Check the status of a PDF generation job
     */
    public function checkGenerationStatus($jobId)
    {
        try {
            $jobData = Cache::get('pdf_generation_' . $jobId);
            
            if (!$jobData) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Job not found',
                    'code' => 'JOB_NOT_FOUND'
                ], 404);
            }

            if ($jobData['user_id'] !== Auth::id()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Unauthorized access',
                    'code' => 'UNAUTHORIZED'
                ], 403);
            }

            return response()->json([
                'status' => $jobData['status'],
                'downloadUrl' => $jobData['status'] === 'completed' ? $jobData['downloadUrl'] : null,
                'error' => $jobData['error'] ?? null
            ]);

        } catch (\Exception $e) {
            Log::error('Status Check Error:', [
                'jobId' => $jobId,
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to check status',
                'code' => 'STATUS_CHECK_ERROR'
            ], 500);
        }
    }

    /**
     * Clear temporary PDF files
     */
    private function clearTempFiles()
    {
        try {
            // Clear temporary PDF files
            $tempDir = storage_path('app/temp');
            if (is_dir($tempDir)) {
                $files = glob($tempDir . '/temp-*.pdf');
                foreach ($files as $file) {
                    if (is_file($file) && time() - filemtime($file) > 3600) { // Remove files older than 1 hour
                        unlink($file);
                    }
                }
            }

            // Clear old generated exam PDFs
            $examDir = storage_path($this->pdfStoragePath);
            if (is_dir($examDir)) {
                $files = glob($examDir . '/*.pdf');
                foreach ($files as $file) {
                    if (is_file($file) && time() - filemtime($file) > 86400) { // Remove files older than 24 hours
                        unlink($file);
                    }
                }
            }
        } catch (\Exception $e) {
            Log::error('Temp Files Cleanup Error:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
        }
    }

    private function ensureStorageDirectoryExists()
    {
        $examDir = storage_path($this->pdfStoragePath);
        if (!is_dir($examDir)) {
            mkdir($examDir, 0755, true);
        }
    }

    private function generateUniqueFilename()
    {
        return 'exam_' . date('Y-m-d_H-i-s') . '_' . Str::random(8) . '.pdf';
    }

    private function getPublicUrl($filename)
    {
        return url('storage/generated-exams/' . $filename);
    }

    /**
     * Optimize image for PDF
     */
    private function optimizeImage($imageUrl)
    {
        try {
            if (empty($imageUrl)) {
                Log::warning('Empty image URL provided for optimization');
                return null;
            }

            $imageContent = null;
            $maxWidth = 800; // Maximum width in pixels
            $maxHeight = 600; // Maximum height in pixels
            $quality = 80; // JPEG quality

            if (filter_var($imageUrl, FILTER_VALIDATE_URL)) {
                // For external URLs
                $imageContent = @file_get_contents($imageUrl);
                if ($imageContent === false) {
                    Log::error('Failed to fetch external image:', ['url' => $imageUrl]);
                    return null;
                }
            } else {
                // For local storage files
                $path = str_replace('/storage/', '', parse_url($imageUrl, PHP_URL_PATH));
                if (\Illuminate\Support\Facades\Storage::disk('public')->exists($path)) {
                    $imageContent = \Illuminate\Support\Facades\Storage::disk('public')->get($path);
                } else {
                    Log::error('Local image not found:', ['path' => $path]);
                    return null;
                }
            }

            if (!$imageContent) {
                Log::warning('No image content found for optimization');
                return null;
            }

            // Create image resource
            $image = @imagecreatefromstring($imageContent);
            if (!$image) {
                Log::error('Failed to create image resource from content');
                return $imageUrl;
            }

            $width = imagesx($image);
            $height = imagesy($image);

            if ($width > $maxWidth || $height > $maxHeight) {
                $ratio = min($maxWidth / $width, $maxHeight / $height);
                $newWidth = round($width * $ratio);
                $newHeight = round($height * $ratio);

                $newImage = imagecreatetruecolor($newWidth, $newHeight);
                if (!$newImage) {
                    Log::error('Failed to create new image resource for resizing');
                    imagedestroy($image);
                    return $imageUrl;
                }

                imagecopyresampled($newImage, $image, 0, 0, 0, 0, $newWidth, $newHeight, $width, $height);
                imagedestroy($image);
                $image = $newImage;
            }

            ob_start();
            imagejpeg($image, null, $quality);
            $optimizedContent = ob_get_clean();
            imagedestroy($image);

            if (!$optimizedContent) {
                Log::error('Failed to generate optimized image content');
                return $imageUrl;
            }

            // Convert to base64 data URI
            $base64 = base64_encode($optimizedContent);
            return 'data:image/jpeg;base64,' . $base64;
        } catch (\Exception $e) {
            Log::error('Image optimization failed:', [
                'url' => $imageUrl,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return $imageUrl;
        }
    }

    /**
     * Download a generated exam PDF
     */
    public function downloadExam($filename)
    {
        try {
            $filePath = storage_path($this->pdfStoragePath . '/' . $filename);
            
            if (!file_exists($filePath)) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'File not found',
                    'details' => 'The requested exam file does not exist or has been removed.',
                    'code' => 'FILE_NOT_FOUND'
                ], 404);
            }

            // Set headers for download
            $headers = [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => 'attachment; filename="' . $filename . '"',
                'Cache-Control' => 'no-cache, private',
                'Pragma' => 'no-cache',
                'Content-Length' => filesize($filePath)
            ];

            // Return the file response
            return response()->file($filePath, $headers);

        } catch (\Exception $e) {
            Log::error('PDF Download Error:', [
                'filename' => $filename,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'status' => 'error',
                'message' => 'Download Failed',
                'details' => 'Unable to download the PDF file.',
                'code' => 'DOWNLOAD_ERROR'
            ], 500);
        }
    }
}
