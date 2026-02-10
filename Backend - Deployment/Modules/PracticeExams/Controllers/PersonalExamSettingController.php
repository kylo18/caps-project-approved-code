<?php

namespace Modules\PracticeExams\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;
use Modules\PracticeExams\Models\PersonalExamSetting;
use Illuminate\Support\Facades\Log;

class PersonalExamSettingController extends Controller
{
    /**
     * Store or update personal exam settings for a subject.
     * Accessible to all roles except students (roleID != 1).
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request)
    {
        try {
            $user = Auth::user();

            // Authorization check: All except students
            if ($user->roleID == 1) {
                return response()->json(['message' => 'Unauthorized.'], 403);
            }

            // Validate incoming request
            $validated = $request->validate([
                'subjectID' => 'required|exists:subjects,subjectID',
                'isEnabled' => 'required|boolean',
                'enableTimer' => 'required|boolean',
                'duration_minutes' => 'nullable|integer|max:240',
                'coverage' => 'required|in:midterm,final,full',
                'easy_percentage' => 'required|integer|min:0|max:100',
                'moderate_percentage' => 'required|integer|min:0|max:100',
                'hard_percentage' => 'required|integer|min:0|max:100',
                'total_items' => 'required|integer|min:1|max:100',
            ]);

            // Ensure difficulty percentages total exactly 100
            $total = $validated['easy_percentage'] + $validated['moderate_percentage'] + $validated['hard_percentage'];
            if ($total !== 100) {
                return response()->json(['message' => 'Percentages must total 100.'], 422);
            }

            // Remove existing setting for subject before creating new one
            PersonalExamSetting::where('subjectID', $validated['subjectID'])->delete();

            // Set default duration if timer is enabled
            if ($validated['enableTimer']) {
                $validated['duration_minutes'] = $validated['duration_minutes'] ?? 30;
            } else {
                $validated['duration_minutes'] = 0;
            }

            // Save the settings
            $setting = PersonalExamSetting::create(array_merge($validated, [
                'createdBy' => $user->userID,
                'purpose_id' => 3,
            ]));

            return response()->json([
                'message' => 'Personal exam settings saved successfully.',
                'data' => $setting
            ], 201);
        } catch (\Throwable $e) {
            Log::error('Personal exam setting error: ' . $e->getMessage());

            return response()->json([
                'message' => 'An internal error occurred.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Show existing personal exam settings for a subject.
     *
     * @param int $subjectID
     * @return \Illuminate\Http\JsonResponse
     */
    public function show($subjectID)
    {
        try {
            // Fetch setting based on subject ID
            $setting = PersonalExamSetting::where('subjectID', $subjectID)->first();

            if (!$setting) {
                return response()->json([
                    'message' => 'Personal exam setting not found for this subject.'
                ], 404);
            }

            return response()->json([
                'message' => 'Personal exam setting retrieved successfully.',
                'data' => $setting
            ], 200);
        } catch (\Exception $e) {
            Log::error('Error fetching personal exam setting: ' . $e->getMessage());

            return response()->json([
                'error' => 'Internal Server Error',
                'message' => $e->getMessage()
            ], 500);
        }
    }
} 