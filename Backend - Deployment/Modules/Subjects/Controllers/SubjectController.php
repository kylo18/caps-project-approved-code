<?php

namespace Modules\Subjects\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Storage;
use Modules\Subjects\Models\Subject;
use Modules\Subjects\Models\YearLevel;
use Illuminate\Support\Facades\Auth;
use Modules\Users\Models\Program;
use Modules\PracticeExams\Models\PracticeExamSetting;
use Illuminate\Support\Facades\DB;

class SubjectController extends Controller
{
    /**
     * Store a new subject if it doesn't already exist for the given program.
     */
    public function store(Request $request)
    {
        try {
            // Validate input fields
            $request->validate([
                'programID'    => 'required|exists:programs,programID',
                'subjectCode'  => 'required|string',
                'subjectName'  => 'required|string',
                'yearLevelID'  => 'required|exists:year_levels,yearLevelID',
            ]);

            // Prevent duplicate subject entries (same code, name, program and year level)
            $existingSubject = Subject::where('subjectCode', $request->subjectCode)
                ->where('subjectName', $request->subjectName)
                ->where('programID', $request->programID)
                ->where('yearLevelID', $request->yearLevelID)
                ->first();

            if ($existingSubject) {
                return response()->json([
                    'message' => 'Subject already exists for this program and year level.',
                    'existing_subject' => $existingSubject
                ], 409);
            } else {
                // Create new subject
                $subject = Subject::create([
                    'programID'   => $request->programID,
                    'subjectCode' => $request->subjectCode,
                    'subjectName' => $request->subjectName,
                    'yearLevelID' => $request->yearLevelID,
                    'is_enabled_for_exam_questions' => true,
                ]);
                return response()->json([
                    'message' => 'Subject created successfully.',
                    'subject' => $subject
                ], 201);
            }
        } catch (\Exception $e) {
            Log::error('Error creating subject: ' . $e->getMessage());

            return response()->json([
                'error'   => 'Internal Server Error',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Retrieve subjects based on the user's role (Program Chair, Dean, or Instructor).
     */
    public function index(Request $request)
    {
        try {
            $user = Auth::user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized'
                ], 401);
            }

            // Only allow Dean (4), Associate Dean (5), Program Chair (3), and Instructors (2) to access
            if (!in_array($user->roleID, [2, 3, 4, 5])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Forbidden. Only Dean, Associate Dean, Program Chair, and Instructors can view subjects.'
                ], 403);
            }

            // Get subjects based on role
            $query = DB::table('subjects as s')
                ->join('programs as p', 'p.programID', '=', 's.programID')
                ->join('year_levels as yl', 'yl.yearLevelID', '=', 's.yearLevelID')
                ->select(
                    's.subjectID',
                    's.subjectCode',
                    's.subjectName',
                    's.programID',
                    'p.programName',
                    's.yearLevelID',
                    'yl.name as yearLevel'
                );

            // Program Chair: show only their program subjects + general subjects
            if ($user->roleID === 3) {
                $query->where(function ($q) use ($user) {
                    $q->where('s.programID', $user->programID)
                      ->orWhere('s.programID', 6); // General subjects
                });
            }

            $subjects = $query->orderBy('s.subjectID')->get();

            if ($subjects->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'No subjects found',
                    'subjects' => []
                ], 404);
            }

            // Format the subjects
            $formattedSubjects = $subjects->map(function ($subject) {
                $programName = $subject->programName;
                if (strpos($programName, 'BS-') === 0) {
                    $programName = substr($programName, 3);
                }

                return [
                    'subjectID' => $subject->subjectID,
                    'subjectCode' => $subject->subjectCode,
                    'subjectName' => $subject->subjectName,
                    'programID' => $subject->programID,
                    'programName' => $programName,
                    'yearLevelID' => $subject->yearLevelID,
                    'yearLevel' => $subject->yearLevel
                ];
            });

            return response()->json([
                'success' => true,
                'message' => 'Subjects retrieved successfully',
                'subjects' => $formattedSubjects
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error retrieving subjects: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while retrieving subjects',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update an existing subject. Only accessible by the Dean.
     */
    public function update(Request $request, $subjectID)
    {
        try {
            Log::info('Starting subject update', ['subjectID' => $subjectID, 'request' => $request->all()]);

            // Check authentication and authorization
            $user = $this->checkAuthorization();
            if (!$user['success']) {
                return response()->json($user['response'], $user['status']);
            }

            // Find and validate subject existence
            $subject = Subject::with(['program', 'yearLevel'])->find($subjectID);
            if (!$subject) {
                Log::warning('Subject not found', ['subjectID' => $subjectID]);
                return response()->json([
                    'success' => false,
                    'message' => 'Subject not found.'
                ], 404);
            }

            // Validate input data
            $validated = $this->validateSubjectData($request);
            if (!$validated['success']) {
                return response()->json($validated['response'], $validated['status']);
            }

            // Check for duplicates
            $duplicate = $this->checkDuplicateSubject(
                $validated['data']['subjectCode'],
                $validated['data']['subjectName'],
                $validated['data']['programID'],
                $validated['data']['yearLevelID'],
                $subjectID
            );
            if ($duplicate) {
                Log::info('Duplicate subject found', ['duplicate' => $duplicate]);
                return response()->json([
                    'success' => false,
                    'message' => 'Another subject with the same code, name, program, and year level already exists.',
                    'duplicate' => $duplicate
                ], 409);
            }

            // Update the subject
            $updateResult = $this->performSubjectUpdate($subject, $validated['data']);
            
            Log::info('Update completed successfully', ['response' => $updateResult]);
            return response()->json($updateResult, 200);

        } catch (\Exception $e) {
            Log::error('Failed to update subject', [
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
                'request_data' => $request->all(),
                'subject_id' => $subjectID,
                'exception_class' => get_class($e)
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to update subject.',
                'error' => $e->getMessage(),
                'debug_info' => app()->environment('local') ? [
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                    'type' => get_class($e)
                ] : null
            ], 500);
        }
    }

    /**
     * Check user authorization for subject updates.
     */
    private function checkAuthorization()
    {
        $user = Auth::user();
        if (!$user) {
            Log::error('No authenticated user found');
            return [
                'success' => false,
                'response' => [
                    'success' => false,
                    'message' => 'Unauthorized. User not authenticated.'
                ],
                'status' => 401
            ];
        }

        if (!in_array($user->roleID, [4, 5])) {
            Log::warning('Unauthorized access attempt', ['userRole' => $user->roleID]);
            return [
                'success' => false,
                'response' => [
                    'success' => false,
                    'message' => 'Unauthorized. Only the Dean or Associate Dean can modify subjects.'
                ],
                'status' => 403
            ];
        }

        return ['success' => true];
    }

    /**
     * Validate subject update data.
     */
    private function validateSubjectData(Request $request)
    {
        try {
            $validated = $request->validate([
                'subjectCode' => 'required|string|max:50',
                'subjectName' => 'required|string|max:255',
                'programID'   => 'nullable|exists:programs,programID',
                'yearLevelID' => 'required|exists:year_levels,yearLevelID',
            ]);

            return [
                'success' => true,
                'data' => [
                    'subjectCode' => trim($validated['subjectCode']),
                    'subjectName' => trim($validated['subjectName']),
                    'programID'   => $validated['programID'] ?? null,
                    'yearLevelID' => $validated['yearLevelID']
                ]
            ];
        } catch (\Illuminate\Validation\ValidationException $e) {
            return [
                'success' => false,
                'response' => [
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $e->errors()
                ],
                'status' => 422
            ];
        }
    }

    /**
     * Check for duplicate subjects.
     */
    private function checkDuplicateSubject($subjectCode, $subjectName, $programID, $yearLevelID, $currentSubjectID)
    {
        return Subject::where('subjectCode', $subjectCode)
            ->where('subjectName', $subjectName)
            ->where('programID', $programID)
            ->where('yearLevelID', $yearLevelID)
            ->where('subjectID', '!=', $currentSubjectID)
            ->first();
    }

    /**
     * Perform the subject update operation.
     */
    private function performSubjectUpdate($subject, $data)
    {
        Log::info('About to update subject', $data);

        $subject->fill([
            'subjectCode' => $data['subjectCode'],
            'subjectName' => $data['subjectName'],
            'programID'   => $data['programID'],
            'yearLevelID' => $data['yearLevelID'],
        ]);

        $changes = $subject->getDirty();
        Log::info('Changes to be applied', ['changes' => $changes]);
        
        $subject->save();
        Log::info('Subject saved successfully');

        $subject->refresh();

        return [
            'success' => true,
            'message' => 'Subject updated successfully.',
            'data'    => [
                'subject' => $subject,
                'changes' => $changes,
                'relationships' => [
                    'program' => $subject->program,
                    'yearLevel' => $subject->yearLevel
                ]
            ]
        ];
    }

    /**
     * Delete a subject. Only accessible by the Dean.
     */
    public function destroy($subjectID)
    {
        $user = Auth::user();

        // Only Dean or Associate Dean can delete subjects
        if (!in_array($user->roleID, [4, 5])) {
            return response()->json([
                'message' => 'Unauthorized. Only the Dean or Associate Dean can delete subjects.'
            ], 403);
        }

        $subject = Subject::where('subjectID', $subjectID)->first();

        if (!$subject) {
            return response()->json([
                'message' => 'Subject not found.'
            ], status: 404);
        }

        try {
            // Delete subject
            $subject->delete();

            return response()->json([
                'message' => 'Subject deleted successfully.'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to delete subject.',
                'error'   => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get subjects for the student's program (including GE subjects) that have practice exam settings.
     */
    public function getProgramSubjects()
    {
        $user = Auth::user();

        // Only students can access this
        if ($user->roleID !== 1) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        // Fetch program-specific and general education subjects with practice exam settings
        $subjects = Subject::with(['program', 'yearLevel'])
            ->where(function ($query) use ($user) {
                $query->where('programID', $user->programID)
                    ->orwhere('programID', 6) // General subjects
                    ->orWhereHas('program', function ($subQuery) {
                        $subQuery->where('programName', 'LIKE', '%General Education%');
                    });
            })
            ->whereHas('practiceExamSetting') // Only if practice exam settings exist
            ->select('subjectID', 'subjectName', 'subjectCode', 'programID', 'yearLevelID')
            ->get();

        $formattedSubjects = $subjects->map(function ($subject) {
            return [
                'subjectID' => $subject->subjectID,
                'subjectName' => $subject->subjectName,
                'subjectCode' => $subject->subjectCode,
                'programID' => $subject->programID,
                'programName' => $subject->program ? $subject->program->programName : null,
                'yearLevelID' => $subject->yearLevelID,
                'yearLevel' => $subject->yearLevel ? $subject->yearLevel->name : null,
            ];
        });

        return response()->json([
            'message' => 'Subjects available for practice exam.',
            'data' => $formattedSubjects
        ], 200);
    }

    /**
     * Enable exam questions (purpose_id 3) for a subject. Only accessible by the Dean (roleID 4).
     */
    public function enableExamQuestions($subjectID)
    {
        $user = Auth::user();
        if (!$user || $user->roleID !== 4) {
            return response()->json(['success' => false, 'message' => 'Forbidden. Only the Dean can enable exam questions.'], 403);
        }
        $subject = Subject::find($subjectID);
        if (!$subject) {
            return response()->json(['success' => false, 'message' => 'Subject not found.'], 404);
        }
        $subject->is_enabled_for_exam_questions = true;
        $subject->save();
        return response()->json(['success' => true, 'message' => 'Exam questions enabled for this subject.', 'subjectID' => $subjectID]);
    }

    /**
     * Disable exam questions (purpose_id 3) for a subject. Only accessible by the Dean (roleID 4).
     */
    public function disableExamQuestions($subjectID)
    {
        $user = Auth::user();
        if (!$user || $user->roleID !== 4) {
            return response()->json(['success' => false, 'message' => 'Forbidden. Only the Dean can disable exam questions.'], 403);
        }
        $subject = Subject::find($subjectID);
        if (!$subject) {
            return response()->json(['success' => false, 'message' => 'Subject not found.'], 404);
        }
        $subject->is_enabled_for_exam_questions = false;
        $subject->save();
        return response()->json(['success' => true, 'message' => 'Exam questions disabled for this subject.', 'subjectID' => $subjectID]);
    }

    /**
     * Get the exam questions status for a subject. Accessible by all authenticated users.
     */
    public function getExamQuestionsStatus($subjectID)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized'
                ], 401);
            }

            $subject = Subject::find($subjectID);
            if (!$subject) {
                return response()->json([
                    'success' => false,
                    'message' => 'Subject not found.'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'message' => 'Exam questions status retrieved successfully.',
                'data' => [
                    'subjectID' => $subject->subjectID,
                    'subjectCode' => $subject->subjectCode,
                    'subjectName' => $subject->subjectName,
                    'is_enabled_for_exam_questions' => (bool) $subject->is_enabled_for_exam_questions
                ]
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error retrieving exam questions status: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while retrieving exam questions status.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get subjects grouped by base name for the student dashboard.
     * Strips trailing numbers so "Calculus 1" and "Calculus 2" merge under "Calculus".
     *
     * GET /api/student/dashboard-subjects
     * Auth: Student (roleID 1)
     */
    public function getDashboardSubjects(Request $request)
    {
        try {
            $user = Auth::user();

            if (!$user) {
                return response()->json(['success' => false, 'message' => 'Unauthorized'], 401);
            }

            // Fetch subjects for the student's program + GE subjects that have practice exam settings.
            // Mirrors the logic in getProgramSubjects() so the dashboard only shows subjects
            // a student can actually take an exam on.
            $subjects = Subject::where(function ($query) use ($user) {
                $query->where('programID', $user->programID)
                      ->orWhere('programID', 6) // programID 6 = general subjects
                      ->orWhereHas('program', function ($subQuery) {
                          $subQuery->where('programName', 'LIKE', '%General Education%');
                      });
            })
            ->whereHas('practiceExamSetting') // only subjects with exam settings configured
            ->with('practiceExamSetting')
            ->get();

            // Group by base name — strip trailing numbers, e.g. "Calculus 1" → "Calculus"
            $grouped = [];
            foreach ($subjects as $subject) {
                $baseName = trim(preg_replace('/\s*\d+\s*$/', '', $subject->subjectName));

                if (!isset($grouped[$baseName])) {
                    $grouped[$baseName] = [
                        'baseName'     => $baseName,
                        'subjectImage' => $subject->subjectImage
                            ? asset('storage/' . $subject->subjectImage)
                            : null,
                        'versions' => [],
                    ];
                }

                $grouped[$baseName]['versions'][] = [
                    'subjectID'      => $subject->subjectID,
                    'subjectName'    => $subject->subjectName,
                    'subjectCode'    => $subject->subjectCode,
                    'hasExamEnabled' => $subject->practiceExamSetting
                        && $subject->practiceExamSetting->isEnabled,
                ];
            }

            return response()->json([
                'data' => array_values($grouped),
            ]);

        } catch (\Exception $e) {
            Log::error('Error retrieving dashboard subjects: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'An error occurred while retrieving dashboard subjects.',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get exam preview metadata with difficulty breakdown for a given subject.
     *
     * GET /api/subjects/{id}/exam-preview
     * Auth: Any authenticated user
     */
    public function getExamPreview($subjectID)
    {
        try {
            $subject = Subject::findOrFail($subjectID);

            $settings = PracticeExamSetting::where('subjectID', $subjectID)->first();

            if (!$settings) {
                return response()->json(['message' => 'Exam settings not found'], 404);
            }

            $totalQuestions  = $settings->total_items;
            $easyCount       = (int) round(($settings->easy_percentage / 100) * $totalQuestions);
            $moderateCount   = (int) round(($settings->moderate_percentage / 100) * $totalQuestions);
            $hardCount       = $totalQuestions - $easyCount - $moderateCount;
            $totalPoints     = $totalQuestions * 2; // each question is worth 2 points

            return response()->json([
                'subjectName'        => $subject->subjectName,
                'subjectCode'        => $subject->subjectCode,
                'totalQuestions'     => $totalQuestions,
                'totalPoints'        => $totalPoints,
                'enableTimer'        => $settings->enableTimer,
                'durationMinutes'    => $settings->duration_minutes,
                'difficultyBreakdown' => [
                    'easy' => [
                        'count'      => $easyCount,
                        'percentage' => $settings->easy_percentage,
                    ],
                    'moderate' => [
                        'count'      => $moderateCount,
                        'percentage' => $settings->moderate_percentage,
                    ],
                    'hard' => [
                        'count'      => $hardCount,
                        'percentage' => $settings->hard_percentage,
                    ],
                ],
            ]);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['message' => 'Subject not found'], 404);

        } catch (\Exception $e) {
            Log::error('Error retrieving exam preview: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'An error occurred while retrieving exam preview.',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Upload or replace the image for a subject.
     * Deletes the old image from storage before saving the new one.
     *
     * POST /api/subjects/{id}/upload-image
     * Auth: Admin or Faculty (roleID 2, 3, 4, 5)
     */
    public function uploadSubjectImage(Request $request, $subjectID)
    {
        try {
            $user = Auth::user();

            if (!$user) {
                return response()->json(['message' => 'Unauthorized'], 401);
            }

            // Only Faculty (2), Program Chair (3), Dean (4), Associate Dean (5)
            if (!in_array($user->roleID, [2, 3, 4, 5])) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $request->validate([
                'image' => 'required|image|mimes:jpeg,png,jpg,webp|max:2048',
            ]);

            $subject = Subject::findOrFail($subjectID);

            // Remove old image from disk if one already exists
            if ($subject->subjectImage) {
                Storage::disk('public')->delete($subject->subjectImage);
            }

            // Store the new image under storage/app/public/subjects/
            $path = $request->file('image')->store('subjects', 'public');

            $subject->subjectImage = $path;
            $subject->save();

            return response()->json([
                'message'      => 'Image uploaded successfully',
                'subjectImage' => asset('storage/' . $path),
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors'  => $e->errors(),
            ], 422);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['message' => 'Subject not found'], 404);

        } catch (\Exception $e) {
            Log::error('Error uploading subject image: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'An error occurred while uploading the image.',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }
}
