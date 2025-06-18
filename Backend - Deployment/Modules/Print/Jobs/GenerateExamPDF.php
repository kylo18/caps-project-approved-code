<?php

namespace Modules\Print\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Barryvdh\DomPDF\Facade\Pdf;
use Intervention\Image\Facades\Image;

class GenerateExamPDF implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $jobId;
    protected $examData;
    protected $pdfStoragePath = 'app/public/generated-exams';
    protected $maxImageWidth = 600;  // Reduced for server performance
    protected $maxImageHeight = 400; // Reduced for server performance
    protected $imageQuality = 70;    // Reduced for server performance
    protected $chunkSize = 10;       // Reduced chunk size for server

    /**
     * The number of times the job may be attempted.
     *
     * @var int
     */
    public $tries = 3;

    /**
     * The number of seconds the job can run before timing out.
     *
     * @var int
     */
    public $timeout = 1800;

    /**
     * The number of seconds to wait before retrying the job.
     *
     * @var int
     */
    public $backoff = 60;

    /**
     * Create a new job instance.
     */
    public function __construct($jobId, $examData)
    {
        $this->jobId = $jobId;
        $this->examData = $examData;
        $this->onQueue('pdf-generation');
    }

    /**
     * Execute the job.
     */
    public function handle()
    {
        try {
            $this->updateJobStatus('processing');
            $workerId = gethostname() . '-' . getmypid();
            
            Log::info('PDF Generation started', [
                'jobId' => $this->jobId,
                'workerId' => $workerId,
                'memory_usage' => memory_get_usage(true)
            ]);

            // Set server-specific limits
            ini_set('memory_limit', '1024M');
            ini_set('max_execution_time', '1800');
            set_time_limit(1800);
            gc_enable();

            // Optimize images before PDF generation
            $this->optimizeImages();

            // Configure PDF with server-optimized settings
            $pdf = PDF::loadView('exams.printable', [
                'questionsBySubject' => $this->examData['questionsBySubject'],
                'examTitle' => $this->examData['examTitle'],
                'leftLogoPath' => $this->examData['logos']['left'],
                'rightLogoPath' => $this->examData['logos']['right']
            ]);

            $pdfOptions = [
                'isRemoteEnabled' => true,
                'isPhpEnabled' => true,
                'isHtml5ParserEnabled' => true,
                'dpi' => 120,  // Reduced for server performance
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
                'image_cache_enabled' => true,
                'defaultMediaType' => 'print',
                'defaultPaperSize' => 'a4',
                'fontHeightRatio' => 1,
                'isFontSubsettingEnabled' => true,
                'memory_limit' => '1024M',
                'max_execution_time' => 1800
            ];

            $pdf->setOptions($pdfOptions);
            $pdf->setPaper('A4', 'portrait');

            $this->ensureStorageDirectoryExists();
            $filename = $this->generateUniqueFilename($workerId);
            $filePath = storage_path($this->pdfStoragePath . '/' . $filename);

            $this->clearTempFiles();
            
            // Always use chunked generation for server stability
            $this->generatePDFInChunks($pdf, $filePath);

            if (!file_exists($filePath)) {
                throw new \Exception("Failed to generate PDF file");
            }

            $this->updateJobStatus('completed', [
                'downloadUrl' => url('storage/generated-exams/' . $filename),
                'filename' => $filename,
                'workerId' => $workerId
            ]);

            Log::info('PDF Generation completed', [
                'jobId' => $this->jobId,
                'workerId' => $workerId,
                'memory_usage' => memory_get_usage(true)
            ]);

        } catch (\Exception $e) {
            Log::error('PDF Generation Job Error:', [
                'jobId' => $this->jobId,
                'workerId' => $workerId ?? 'unknown',
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'memory_usage' => memory_get_usage(true)
            ]);

            $this->updateJobStatus('failed', [
                'error' => $e->getMessage(),
                'workerId' => $workerId ?? 'unknown'
            ]);

            if (isset($filePath) && file_exists($filePath)) {
                unlink($filePath);
            }

            if ($this->attempts() < $this->tries) {
                $this->release($this->backoff);
            }
        }
    }

    /**
     * Optimize images before PDF generation
     */
    protected function optimizeImages()
    {
        try {
            foreach ($this->examData['questionsBySubject'] as &$subject) {
                foreach ($subject['questions'] as &$question) {
                    if (!empty($question['questionImage'])) {
                        $question['questionImage'] = $this->optimizeImage($question['questionImage']);
                    }

                    foreach ($question['choices'] as &$choice) {
                        if (!empty($choice['choiceImage'])) {
                            $choice['choiceImage'] = $this->optimizeImage($choice['choiceImage']);
                        }
                    }
                }
            }
        } catch (\Exception $e) {
            Log::error('Image optimization failed:', [
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Optimize a single image
     */
    protected function optimizeImage($imageUrl)
    {
        try {
            if (empty($imageUrl)) {
                return $imageUrl;
            }

            $image = Image::make($imageUrl);
            
            // Resize if larger than max dimensions
            if ($image->width() > $this->maxImageWidth || $image->height() > $this->maxImageHeight) {
                $image->resize($this->maxImageWidth, $this->maxImageHeight, function ($constraint) {
                    $constraint->aspectRatio();
                    $constraint->upsize();
                });
            }

            // Optimize and save to temporary file
            $tempPath = storage_path('app/temp/' . Str::random(16) . '.jpg');
            $image->save($tempPath, $this->imageQuality);

            // Convert to base64
            $base64 = base64_encode(file_get_contents($tempPath));
            unlink($tempPath);

            return 'data:image/jpeg;base64,' . $base64;
        } catch (\Exception $e) {
            Log::error('Single image optimization failed:', [
                'url' => $imageUrl,
                'error' => $e->getMessage()
            ]);
            return $imageUrl;
        }
    }

    /**
     * Generate PDF in chunks for large documents
     */
    protected function generatePDFInChunks($pdf, $filePath)
    {
        $subjects = $this->examData['questionsBySubject'];
        $totalChunks = ceil(count($subjects) / $this->chunkSize);
        
        for ($i = 0; $i < $totalChunks; $i++) {
            $chunk = array_slice($subjects, $i * $this->chunkSize, $this->chunkSize);
            
            // Update the view data for this chunk
            $pdf->loadView('exams.printable', [
                'questionsBySubject' => $chunk,
                'examTitle' => $this->examData['examTitle'],
                'leftLogoPath' => $this->examData['logos']['left'],
                'rightLogoPath' => $this->examData['logos']['right'],
                'isChunk' => true,
                'chunkNumber' => $i + 1,
                'totalChunks' => $totalChunks
            ]);

            // Save chunk
            if ($i === 0) {
                $pdf->save($filePath);
            } else {
                $tempPath = storage_path('app/temp/chunk_' . $i . '.pdf');
                $pdf->save($tempPath);
                
                // Merge PDFs
                $this->mergePDFs($filePath, $tempPath);
                unlink($tempPath);
            }

            // Clear memory after each chunk
            gc_collect_cycles();
            if (function_exists('opcache_reset')) {
                opcache_reset();
            }
        }
    }

    /**
     * Merge two PDF files
     */
    protected function mergePDFs($mainFile, $chunkFile)
    {
        try {
            $mainPdf = new \setasign\Fpdi\Fpdi();
            $pageCount = $mainPdf->setSourceFile($mainFile);
            
            for ($i = 1; $i <= $pageCount; $i++) {
                $tplId = $mainPdf->importPage($i);
                $mainPdf->AddPage();
                $mainPdf->useTemplate($tplId);
            }

            $chunkPdf = new \setasign\Fpdi\Fpdi();
            $pageCount = $chunkPdf->setSourceFile($chunkFile);
            
            for ($i = 1; $i <= $pageCount; $i++) {
                $tplId = $chunkPdf->importPage($i);
                $mainPdf->AddPage();
                $mainPdf->useTemplate($tplId);
            }

            $mainPdf->Output($mainFile, 'F');
        } catch (\Exception $e) {
            Log::error('PDF merge failed:', [
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception)
    {
        Log::error('PDF Generation Job Failed:', [
            'jobId' => $this->jobId,
            'error' => $exception->getMessage(),
            'attempts' => $this->attempts(),
            'memory_usage' => memory_get_usage(true)
        ]);

        $this->updateJobStatus('failed', [
            'error' => 'Job failed after ' . $this->attempts() . ' attempts: ' . $exception->getMessage()
        ]);
    }

    /**
     * Update the job status in cache
     */
    protected function updateJobStatus($status, $additionalData = [])
    {
        $jobData = Cache::get('pdf_generation_' . $this->jobId) ?? [];
        $jobData['status'] = $status;
        $jobData['updated_at'] = now()->timestamp;
        $jobData = array_merge($jobData, $additionalData);
        Cache::put('pdf_generation_' . $this->jobId, $jobData, 3600);
    }

    /**
     * Ensure storage directory exists
     */
    protected function ensureStorageDirectoryExists()
    {
        $examDir = storage_path($this->pdfStoragePath);
        if (!is_dir($examDir)) {
            mkdir($examDir, 0755, true);
        }
    }

    /**
     * Generate unique filename
     */
    protected function generateUniqueFilename($workerId)
    {
        return 'exam_' . date('Y-m-d_H-i-s') . '_' . Str::random(8) . '_' . $workerId . '.pdf';
    }

    /**
     * Clear temporary files
     */
    protected function clearTempFiles()
    {
        try {
            // Clear temporary PDF files
            $tempDir = storage_path('app/temp');
            if (is_dir($tempDir)) {
                $files = glob($tempDir . '/temp-*.pdf');
                foreach ($files as $file) {
                    if (is_file($file) && time() - filemtime($file) > 3600) {
                        unlink($file);
                    }
                }
            }

            // Clear old generated exam PDFs
            $examDir = storage_path($this->pdfStoragePath);
            if (is_dir($examDir)) {
                $files = glob($examDir . '/*.pdf');
                foreach ($files as $file) {
                    if (is_file($file) && time() - filemtime($file) > 86400) {
                        unlink($file);
                    }
                }
            }
        } catch (\Exception $e) {
            Log::error('Temp Files Cleanup Error:', [
                'error' => $e->getMessage()
            ]);
        }
    }
} 