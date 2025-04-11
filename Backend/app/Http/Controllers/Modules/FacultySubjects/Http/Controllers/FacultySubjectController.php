<?php

namespace app\Http\Controllers\Modules\FacultySubjects\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\Controller;

class FacultySubjectController extends Controller
{
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

    // Get subjects assigned to the user
    public function mySubjects()
    {
        $user = Auth::user();
        $subjects = $user->subjects;

        return response()->json([
            'subjects' => $subjects
        ]);
    }

    public function removeSubject(Request $request)
    {
        $user = Auth::user();

        if (!in_array($user->roleID, [2, 3, 4])) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $request->validate([
            'subjectID' => 'required|exists:subjects,subjectID',
        ]);

        $subjectID = $request->subjectID;

        if (!$user->subjects()->where('faculty_subjects.subjectID', $subjectID)->exists()) {
            return response()->json(['message' => 'Subject not assigned to this user.'], 404);
        }

        $user->subjects()->detach($subjectID);

        return response()->json(['message' => 'Subject removed successfully.'], 200);
    }
}
