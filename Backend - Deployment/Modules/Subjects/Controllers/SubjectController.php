<?php

namespace Modules\Subjects\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Routing\Controller;
use Modules\Subjects\Models\Subject;
use Illuminate\Support\Facades\Auth;

class SubjectController extends Controller
{
    // Function to create a new subject
    public function store(Request $request)
    {
        try {
            // Validate request
            $request->validate([
                'subjectCode' => 'required|string|unique:subjects',
                'subjectName' => 'required|string',
            ]);

            $subject = Subject::create([
                'subjectCode' => $request->subjectCode,
                'subjectName' => $request->subjectName,
            ]);

            return response()->json([
                'message' => 'Subject created successfully',
                'subject' => $subject
            ], 201);
        } catch (\Exception $e) {
            // Log the error
            Log::error('Error creating subject: ' . $e->getMessage());

            return response()->json([
                'error' => 'Internal Server Error',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    // Function to get all subjects
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
                    'message' => 'Access denied. Only Dean can view the subjects list.'
                ], 403);
            }

            // If authorized, retrieve all subjects
            $subjects = Subject::all();

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

        // Only the Dean (roleID = 4) can modify subjects
        if ($user->roleID !== 4) {
            return response()->json([
                'message' => 'Unauthorized. Only the Dean can modify subjects.'
            ], 403);
        }

        $subject = Subject::where('subjectID', $subjectID)->first();

        if (!$subject) {
            return response()->json([
                'message' => 'Subject not found.'
            ], 404);
        }

        $validated = $request->validate([
            'subjectCode' => 'required|string|max:50|unique:subjects,subjectCode,' . $subjectID . ',subjectID',
            'subjectName' => 'required|string|max:255',
        ]);

        try {
            $subject->update([
                'subjectCode' => $validated['subjectCode'],
                'subjectName' => $validated['subjectName'],
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
}
