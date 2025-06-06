<?php

namespace Modules\PracticeExams\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;
use Modules\PracticeExams\Models\PracticeExamSetting;
use Illuminate\Support\Facades\Log;

class PracticeExamSettingController extends Controller
{
    /**
     * Store or update practice exam settings for a subject.
     * Accessible only by Program Chair (roleID 3) or Dean (roleID 4).
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request)
    {
        try {
            $user = Auth::user();

            // Authorization check: Only Program Chair or Dean allowed
            if (!in_array($user->roleID, [3, 4])) {
                return response()->json(['message' => 'Unauthorized.'], 403);
            }

            // Validate incoming request
            $validated = $request->validate([
                'subjectID' => 'required|exists:subjects,subjectID',
                'enableTimer' => 'required|boolean',
                'duration_minutes' => 'nullable|integer|max:240',
                'coverage' => 'required|in:midterm,final,full',
                'easy_percentage' => 'required|integer|min:0|max:100',
                'moderate_percentage' => 'required|integer|min:0|max:100',
                'hard_percentage' => 'required|integer|min:0|max:100',
            ]);

            // Ensure difficulty percentages total exactly 100
            $total = $validated['easy_percentage'] + $validated['moderate_percentage'] + $validated['hard_percentage'];
            if ($total !== 100) {
                return response()->json(['message' => 'Percentages must total 100.'], 422);
            }

            // Remove existing setting for subject before creating new one
            PracticeExamSetting::where('subjectID', $validated['subjectID'])->delete();

            // Set default duration if timer is enabled
            if ($validated['enableTimer']) {
                $validated['duration_minutes'] = $validated['duration_minutes'] ?? 30;
            } else {
                $validated['duration_minutes'] = 0;
            }

            // Save the settings
            $setting = PracticeExamSetting::create(array_merge($validated, [
                'createdBy' => $user->userID,
            ]));

            return response()->json([
                'message' => 'Settings saved successfully.',
                'data' => $setting
            ], 201);
        } catch (\Throwable $e) {
            Log::error('Practice exam setting error: ' . $e->getMessage());

            return response()->json([
                'message' => 'An internal error occurred.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Show existing practice exam settings for a subject.
     *
     * @param int $subjectID
     * @return \Illuminate\Http\JsonResponse
     */
    public function show($subjectID)
    {
        try {
            // Fetch setting based on subject ID
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
