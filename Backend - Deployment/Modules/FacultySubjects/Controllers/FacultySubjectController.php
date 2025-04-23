<?php

namespace Modules\FacultySubjects\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Routing\Controller;
use Modules\Subjects\Models\Subject;

class FacultySubjectController extends Controller
{
    // Assign subjects to faculty (Instructor, Program Chair, Dean)
    public function assignSubject(Request $request)
    {
        $user = Auth::user();

        if (!in_array($user->roleID, [2, 3, 4])) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

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

    public function mySubjects()
    {
        $user = Auth::user();

        if (!in_array($user->roleID, [2, 3, 4])) {
            return response()->json([
                'message' => 'Unauthorized. Only faculty can view assigned subjects.'
            ], 403);
        }

        $subjects = DB::table('subjects')
            ->join('faculty_subjects', 'subjects.subjectID', '=', 'faculty_subjects.subjectID')
            ->where('faculty_subjects.facultyID', $user->userID)
            ->select('subjects.*')
            ->get();

        return response()->json([
            'subjects' => $subjects
        ]);
    }

    public function removeAssignedSubject($subjectID)
    {
        $user = Auth::user();

        // Check if user has permission (roles: Instructor, Program Chair, Associate Dean, Dean)
        if (!in_array($user->roleID, [2, 3, 4])) {
            return response()->json([
                'message' => 'Unauthorized. You are not allowed to remove assigned subjects.'
            ], 403);
        }

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
}
