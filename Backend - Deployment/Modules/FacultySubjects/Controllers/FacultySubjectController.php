<?php

namespace Modules\FacultySubjects\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Routing\Controller;
use Modules\Subjects\Models\Subject;
use Illuminate\Support\Facades\Log;

class FacultySubjectController extends Controller
{
    // Common method to check if the user has the necessary role
    private function checkUserRole($roles = [2, 3, 4])
    {
        $user = Auth::user();

        if (!in_array($user->roleID, $roles)) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        return $user;
    }

    // Common method to get subjects based on user's programID and include programID 6
    private function getSubjectsByUserProgram()
    {
        $user = Auth::user();
        $userProgramID = $user->programID;

        return Subject::with('program')
            ->where(function ($query) use ($userProgramID) {
                $query->where('programID', $userProgramID)
                    ->orWhere('programID', 6); // Include general subjects (programID 6)
            })
            ->get()
            ->map(function ($subject) {
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
                    'programName'  => $programName,
                ];
            });
    }

    // Assign subjects to faculty (Instructor, Program Chair, Dean)
    public function assignSubject(Request $request)
    {
        $user = $this->checkUserRole();

        $request->validate([
            'subjectID' => 'required|exists:subjects,subjectID',
        ]);

        $subjectID = $request->subjectID;

        if ($user->subjects()->where('faculty_subjects.subjectID', $subjectID)->exists()) {
            return response()->json(['message' => 'Subject is already assigned to the user.'], 409);
        }

        $user->subjects()->attach($subjectID);

        return response()->json(['message' => 'Subject assigned successfully.'], 200);
    }

    // Get all subjects assigned to the logged-in faculty
    public function mySubjects()
    {
        $user = $this->checkUserRole();

        try {
            $subjects = DB::table('subjects')
                ->join('faculty_subjects', 'subjects.subjectID', '=', 'faculty_subjects.subjectID')
                ->leftJoin('programs', 'subjects.programID', '=', 'programs.programID') // Left join to get program name
                ->where('faculty_subjects.facultyID', $user->userID)
                ->select('subjects.*', 'programs.programName') // Select programName along with subject fields
                ->get()
                ->map(function ($subject) {
                    // Remove the 'BS-' prefix from the program name if it exists
                    if ($subject->programName && strpos($subject->programName, 'BS-') === 0) {
                        $subject->programName = substr($subject->programName, 3); // Remove the first 3 characters ('BS-')
                    }
                    return $subject;
                });

            return response()->json([
                'subjects' => $subjects
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Internal Server Error',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    // Remove an assigned subject from faculty
    public function removeAssignedSubject($subjectID)
    {
        $user = $this->checkUserRole();

        // Check if the subject is currently assigned
        if (!$user->subjects()->where('faculty_subjects.subjectID', $subjectID)->exists()) {
            return response()->json([
                'message' => 'Subject is not assigned to this user.'
            ], 404);
        }

        try {
            $user->subjects()->detach($subjectID);

            return response()->json([
                'message' => 'Assigned subject removed successfully.'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to remove assigned subject.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // Retrieve all available subjects (those assigned to the user's program and programID 6)
    public function availableSubjects(Request $request)
    {
        try {
            $user = $this->checkUserRole();

            $subjects = $this->getSubjectsByUserProgram();

            return response()->json([
                'message' => 'Subjects retrieved successfully',
                'subjects' => $subjects
            ], 200);
        } catch (\Exception $e) {
            Log::error('Error retrieving subjects: ' . $e->getMessage());

            return response()->json([
                'error' => 'Internal Server Error',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
