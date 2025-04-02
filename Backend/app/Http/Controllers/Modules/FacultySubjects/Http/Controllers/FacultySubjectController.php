<?php

namespace App\Http\Controllers\Modules\FacultySubjects\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\Controller;
use App\Models\Modules\Users\Models\User;
use app\Models\Modules\Subjects\Models\Subject;

class FacultySubjectController extends Controller
{
    // Assign subjects to faculty (Instructor, Program Chair, Dean)
    public function assignSubject(Request $request)
    {
        $user = Auth::user();

        // Only allow faculty members to assign subjects
        if (!in_array($user->roleID, [2, 3, 4])) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        // Validate request
        $request->validate([
            'subjectID' => 'required|exists:subjects,subjectID',
        ]);

        $user->User::subjects()->syncWithoutDetaching([$request->subjectID]);

        return response()->json(['message' => 'Subject assigned successfully']);
    }

    // List subjects assigned to the faculty
    public function mySubjects()
    {
        $user = Auth::user();
        $subjects = $user->subjects;

        return response()->json($subjects);
    }
}
