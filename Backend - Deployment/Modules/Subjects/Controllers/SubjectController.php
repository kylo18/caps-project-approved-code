<?php

namespace Modules\Subjects\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Routing\Controller;
use Modules\Subjects\Models\Subject;
use Illuminate\Support\Facades\Auth;
use Modules\Users\Models\Program;

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
            ]);

            // Prevent duplicate subject entries (same code, name, and program)
            $existingSubject = Subject::where('subjectCode', $request->subjectCode)
                ->where('subjectName', $request->subjectName)
                ->where('programID', $request->programID)
                ->first();

            if ($existingSubject) {
                return response()->json([
                    'message' => 'Subject already exists for this program.',
                    'existing_subject' => $existingSubject
                ], 409);
            } else {
                // Create new subject
                $subject = Subject::create([
                    'programID'   => $request->programID,
                    'subjectCode' => $request->subjectCode,
                    'subjectName' => $request->subjectName,
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
            $user = Auth::user(); // Get the authenticated user

            if (!$user) {
                return response()->json([
                    'error' => 'Unauthorized',
                    'message' => 'User not authenticated'
                ], 401);
            }

            // Allow only Dean, Instructor, or Program Chair to access
            if (!in_array($user->roleID, [2, 3, 4])) {
                return response()->json([
                    'error' => 'Forbidden',
                    'message' => 'Access denied. Only Dean, Instructor, or Program Chair can view the subjects list.'
                ], 403);
            }

            // Role-based subject visibility
            if ($user->roleID === 3) {
                // Program Chair: show subjects for their program + general subjects
                $subjects = Subject::with('program')
                    ->where(function ($query) use ($user) {
                        $query->where('programID', $user->programID)
                              ->orWhere('programID', 6); // General subjects
                    })
                    ->get();
            } else {
                // Dean or Instructor: show all subjects
                $subjects = Subject::with('program')->get();
            }

            // Format subjects and optionally clean program name
            $formattedSubjects = $subjects->map(function ($subject) {
                $programName = $subject->program ? $subject->program->programName : null;

                if ($programName && strpos($programName, 'BS-') === 0) {
                    $programName = substr($programName, 3);
                }

                return [
                    'subjectID'    => $subject->subjectID,
                    'subjectName'  => $subject->subjectName,
                    'subjectCode'  => $subject->subjectCode,
                    'programID'    => $subject->programID,
                    'programName'  => $programName,
                ];
            });

            return response()->json([
                'message' => 'Subjects retrieved successfully',
                'subjects' => $formattedSubjects
            ], 200);
        } catch (\Exception $e) {
            Log::error('Error retrieving subjects: ' . $e->getMessage());

            return response()->json([
                'error' => 'Internal Server Error',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update an existing subject. Only accessible by the Dean.
     */
    public function update(Request $request, $subjectID)
    {
        $user = Auth::user();

        // Only Dean can modify subjects
        if ($user->roleID !== 4) {
            return response()->json([
                'message' => 'Unauthorized. Only the Dean can modify subjects.'
            ], 403);
        }

        $subject = Subject::find($subjectID);

        if (!$subject) {
            return response()->json([
                'message' => 'Subject not found.'
            ], 404);
        }

        // Validate request (programID is nullable for general subjects)
        $validated = $request->validate([
            'subjectCode' => 'required|string|max:50',
            'subjectName' => 'required|string|max:255',
            'programID'   => 'nullable|exists:programs,programID',
        ]);

        try {
            $subjectCode = $validated['subjectCode'];
            $subjectName = $validated['subjectName'];
            $programID = $validated['programID'] ?? null;

            // Prevent duplicate entries excluding current subject
            $duplicate = Subject::where('subjectCode', $subjectCode)
                ->where('subjectName', $subjectName)
                ->where('programID', $programID)
                ->where('subjectID', '!=', $subjectID)
                ->first();

            if ($duplicate) {
                return response()->json([
                    'message' => 'Another subject with the same code, name, and program already exists.',
                    'duplicate' => $duplicate
                ], 409);
            }

            // Update subject
            $subject->update([
                'subjectCode' => $subjectCode,
                'subjectName' => $subjectName,
                'programID'   => $programID,
            ]);

            return response()->json([
                'message' => 'Subject updated successfully.',
                'data'    => $subject
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to update subject.',
                'error'   => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a subject. Only accessible by the Dean.
     */
    public function destroy($subjectID)
    {
        $user = Auth::user();

        // Only Dean can delete subjects
        if ($user->roleID !== 4) {
            return response()->json([
                'message' => 'Unauthorized. Only the Dean can delete subjects.'
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
        $subjects = Subject::with('program')
            ->where(function ($query) use ($user) {
                $query->where('programID', $user->programID)
                    ->orwhere('programID', 6) // General subjects
                    ->orWhereHas('program', function ($subQuery) {
                        $subQuery->where('programName', 'LIKE', '%General Education%');
                    });
            })
            ->whereHas('practiceExamSetting') // Only if practice exam settings exist
            ->select('subjectID', 'subjectName', 'subjectCode', 'programID')
            ->get();

        return response()->json([
            'message' => 'Subjects available for practice exam.',
            'data' => $subjects
        ], 200);
    }
}
