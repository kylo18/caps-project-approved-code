<?php

namespace Modules\PracticeExams\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;
use Modules\PracticeExams\Models\PracticeExamSetting;

class PracticeExamSettingController extends Controller
{
    public function store(Request $request)
    {
        $authUser = Auth::user();

        if (!in_array($authUser->roleID, [3, 4])) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $validated = $request->validate([
            'subjectID' => 'required|exists:subjects,subjectID',
            'enableTimer' => 'required|boolean',
            'coverage' => 'required|in:midterm,final,full',
            'easy_percentage' => 'required|integer|min:0|max:100',
            'moderate_percentage' => 'required|integer|min:0|max:100',
            'hard_percentage' => 'required|integer|min:0|max:100',
        ]);

        // Optional: check if total is 100
        $total = $validated['easy_percentage'] + $validated['moderate_percentage'] + $validated['hard_percentage'];
        if ($total !== 100) {
            return response()->json(['message' => 'Percentages must total 100.'], 422);
        }

        $setting = PracticeExamSetting::updateOrCreate(
            ['subjectID' => $validated['subjectID']],
            [
                ...$validated,
                'createdBy' => $authUser->userID,
            ]
        );

        return response()->json(['message' => 'Settings saved.', 'data' => $setting], 200);
    }

    public function update(Request $request, $subjectID)
    {
        $authUser = Auth::user();

        if (!in_array($authUser->roleID, [3, 4])) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $validated = $request->validate([
            'enableTimer' => 'required|boolean',
            'coverage' => 'required|in:midterm,final,full',
            'easy_percentage' => 'required|integer|min:0|max:100',
            'moderate_percentage' => 'required|integer|min:0|max:100',
            'hard_percentage' => 'required|integer|min:0|max:100',
        ]);

        $total = $validated['easy_percentage'] + $validated['moderate_percentage'] + $validated['hard_percentage'];
        if ($total !== 100) {
            return response()->json(['message' => 'Percentages must total 100.'], 422);
        }

        $setting = PracticeExamSetting::where('subjectID', $subjectID)->first();

        if (!$setting) {
            return response()->json(['message' => 'Practice exam settings not found.'], 404);
        }

        $setting->update([
            ...$validated,
            'updatedBy' => $authUser->userID,
        ]);

        return response()->json(['message' => 'Settings updated successfully.', 'data' => $setting], 200);
    }

    public function destroy($subjectID)
    {
        $authUser = Auth::user();

        if (!in_array($authUser->roleID, [3, 4])) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $setting = PracticeExamSetting::where('subjectID', $subjectID)->first();

        if (!$setting) {
            return response()->json(['message' => 'Practice exam settings not found.'], 404);
        }

        $setting->delete();

        return response()->json(['message' => 'Practice exam settings deleted successfully.'], 200);
    }
}
