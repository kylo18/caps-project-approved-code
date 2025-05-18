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
    /**
     * Check if the authenticated user has one of the allowed roles.
     * Allowed roles: Instructor (2), Program Chair (3), Dean (4).
     *
     * @param array $roles
     * @return \Illuminate\Http\JsonResponse|\Illuminate\Contracts\Auth\Authenticatable|null
     */
    private function checkUserRole($roles = [2, 3, 4])
    {
        $user = Auth::user();

        if (!in_array($user->roleID, $roles)) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        return $user;
    }

    /**
     * Retrieve subjects based on the user's program, including general subjects (programID 6).
     *
     * @return \Illuminate\Support\Collection
     */
    private function getSubjectsByUserProgram()
    {
        $user = Auth::user();
        $userProgramID = $user->programID;

        return Subject::with('program')
            ->where(function ($query) use ($userProgramID) {
                $query->where('programID', $userProgramID)
                      ->orWhere('programID', 6); // Include general subjects
            })
            ->get()
            ->map(function ($subject) {
                $programName = $subject->program ? $subject->program->programName : null;

                // Remove 'BS-' prefix if present
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
    }

    /**
     * Assign a subject to the authenticated faculty.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function assignSubject(Request $request)
    {
        $user = $this->checkUserRole();

        $request->validate([
            'subjectID' => 'required|exists:subjects,subjectID',
        ]);

        $subjectID = $request->subjectID;

        // Prevent duplicate assignments
        if ($user->subjects()->where('faculty_subjects.subjectID', $subjectID)->exists()) {
            return response()->json(['message' => 'Subject is already assigned to the user.'], 409);
        }

        // Assign subject
        $user->subjects()->attach($subjectID);

        return response()->json(['message' => 'Subject assigned successfully.'], 200);
    }

    /**
     * Get all subjects currently assigned to the authenticated faculty.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function mySubjects()
    {
        $user = $this->checkUserRole();

        try {
            $subjects = DB::table('subjects')
                ->join('faculty_subjects', 'subjects.subjectID', '=', 'faculty_subjects.subjectID')
                ->leftJoin('programs', 'subjects.programID', '=', 'programs.programID')
                ->where('faculty_subjects.facultyID', $user->userID)
                ->select('subjects.*', 'programs.programName')
                ->get()
                ->map(function ($subject) {
                    // Remove 'BS-' prefix if present
                    if ($subject->programName && strpos($subject->programName, 'BS-') === 0) {
                        $subject->programName = substr($subject->programName, 3);
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

    /**
     * Remove an assigned subject from the authenticated faculty.
     *
     * @param int $subjectID
     * @return \Illuminate\Http\JsonResponse
     */
    public function removeAssignedSubject($subjectID)
    {
        $user = $this->checkUserRole();

        // Check if the subject is actually assigned
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

    /**
     * Retrieve all subjects available to the authenticated user
     * (those under the user's program and programID 6).
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
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
