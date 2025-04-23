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
    // Function to create a new subject
    public function store(Request $request)
    {
        try {
            // Validate request
            $request->validate([
                'programID'    => 'nullable|exists:programs,programID',
                'subjectCode'  => 'required|string|unique:subjects,subjectCode',
                'subjectName'  => 'required|string',
            ]);

            $subjectCode = $request->subjectCode;

            // If programID is provided, append program name
            if ($request->filled('programID')) {
                $program = Program::find($request->programID);

                if (!$program) {
                    return response()->json(['message' => 'Program not found.'], 404);
                }

                $subjectCode = $program->programName . '-' . $subjectCode;
            }

            // Create the subject (programID can be null for general subjects)
            $subject = Subject::create([
                'programID'   => $request->programID, // will be null for general
                'subjectCode' => $subjectCode,
                'subjectName' => $request->subjectName,
            ]);

            return response()->json([
                'message' => 'Subject created successfully.',
                'subject' => $subject
            ], 201);
        } catch (\Exception $e) {
            Log::error('Error creating subject: ' . $e->getMessage());

            return response()->json([
                'error'   => 'Internal Server Error',
                'message' => $e->getMessage()
            ], 500);
        }
    }


    public function index(Request $request)
    {
        try {
            $user = Auth::user(); // Get the authenticated user

            // Check if the user is authenticated
            if (!$user) {
                return response()->json([
                    'error' => 'Unauthorized',
                    'message' => 'User not authenticated'
                ], 401);
            }

            // Check if the user has roleID = 4 (Dean)  or roleID = 2 (Instructor) or roleID = 3 (Program Chair)
            if (!in_array($user->roleID, [2, 3, 4])) {
                return response()->json([
                    'error' => 'Forbidden',
                    'message' => 'Access denied. Only Dean or Program Chair can view the subjects list.'
                ], 403);
            }

            // If authorized, retrieve all subjects with program name
            $subjects = Subject::with('program') // Eager load the related program
                ->get()
                ->map(function ($subject) {
                    // Include program name in the response, if program exists
                    $programName = $subject->program ? $subject->program->programName : null;

                    // Remove the 'BS-' prefix from the program name if it exists
                    if ($programName && strpos($programName, 'BS-') === 0) {
                        $programName = substr($programName, 3); // Remove the first 3 characters ('BS-')
                    }

                    return [
                        'subjectID'    => $subject->subjectID,
                        'subjectName'  => $subject->subjectName,
                        'subjectCode'  => $subject->subjectCode,
                        'programID'    => $subject->programID,
                        'programName'  => $programName, // Return modified program name
                    ];
                });

            return response()->json([
                'message' => 'Subjects retrieved successfully',
                'subjects' => $subjects
            ], 200);
        } catch (\Exception $e) {
            // Log the error
            Log::error('Error retrieving subjects: ' . $e->getMessage());

            return response()->json([
                'error' => 'Internal Server Error',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, $subjectID)
    {
        $user = Auth::user();

        // Only the Dean can modify subjects
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

        // Validate with nullable programID (for general subjects)
        $validated = $request->validate([
            'subjectCode' => 'required|string|max:50',
            'subjectName' => 'required|string|max:255',
            'programID'   => 'nullable|exists:programs,programID',
        ]);

        try {
            $fullSubjectCode = $validated['subjectCode'];

            // If programID is provided, append program name to subject code
            if (!empty($validated['programID'])) {
                $program = Program::find($validated['programID']);
                if (!$program) {
                    return response()->json(['message' => 'Program not found.'], 404);
                }

                $fullSubjectCode = $program->programName . '-' . $validated['subjectCode'];
            }

            // Check for duplicate code excluding current subject
            $duplicate = Subject::where('subjectCode', $fullSubjectCode)
                ->where('subjectID', '!=', $subjectID)
                ->exists();

            if ($duplicate) {
                return response()->json(['message' => 'Subject code already exists for another subject.'], 422);
            }

            // Update the subject
            $subject->update([
                'subjectCode' => $fullSubjectCode,
                'subjectName' => $validated['subjectName'],
                'programID'   => $validated['programID'], // can be null for general
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

    public function destroy($subjectID)
    {
        $user = Auth::user();

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

    public function getProgramSubjects()
    {
        $user = Auth::user();

        if ($user->roleID !== 1) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        // Fetch subjects specific to user's program or those with no programID (global)
        $subjects = Subject::with('program')
            ->where(function ($query) use ($user) {
                $query->where('programID', $user->programID)
                    ->orWhereNull('programID');
            })
            ->whereHas('practiceExamSetting') // Only include those with settings
            ->select('subjectID', 'subjectName', 'subjectCode', 'programID')
            ->get();

        return response()->json([
            'message' => 'Subjects available for practice exam.',
            'data' => $subjects
        ], 200);
    }
}
