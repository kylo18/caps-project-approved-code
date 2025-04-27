<?php

namespace Modules\PracticeExams\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;
use Modules\PracticeExams\Models\PracticeExamSetting;
use Illuminate\Support\Facades\Log;

class PracticeExamSettingController extends Controller
{
    public function store(Request $request)
    {
        $user = Auth::user();

        if (!in_array($user->roleID, [3, 4])) {
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

        $total = $validated['easy_percentage'] + $validated['moderate_percentage'] + $validated['hard_percentage'];
        if ($total !== 100) {
            return response()->json(['message' => 'Percentages must total 100.'], 422);
        }

        // If a setting already exists for this subject, delete it
        PracticeExamSetting::where('subjectID', $validated['subjectID'])->delete();

        // Create new setting
        $setting = PracticeExamSetting::create(array_merge($validated, [
            'createdBy' => $user->userID
        ]));

        return response()->json([
            'message' => 'Settings saved successfully.',
            'data' => $setting
        ], 201);
    }

    public function show($subjectID)
    {
        try {
            $setting = PracticeExamSetting::where('subjectID', $subjectID)->first();

            if (!$setting) {
                return response()->json([
                    'message' => 'Practice exam setting not found for this subject.'
                ], 404);
            }

            return response()->json([
                'message' => 'Practice exam setting retrieved successfully.',
                'data' => $setting
            ], 200);
        } catch (\Exception $e) {
            Log::error('Error fetching practice exam setting: ' . $e->getMessage());
            return response()->json([
                'error' => 'Internal Server Error',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
