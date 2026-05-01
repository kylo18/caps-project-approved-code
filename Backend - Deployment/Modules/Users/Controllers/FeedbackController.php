<?php

namespace Modules\Users\Controllers;

use Modules\Users\Models\UserFeedback;
use Modules\Users\Models\IssueType;
use Modules\Users\Services\FeedbackStandardizationService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class FeedbackController
{
    /**
     * Submit feedback (POST /feedback)
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'subject' => 'required|string|max:255',
            'issue_type' => 'required|string',
            'message' => 'required|string',
            'category' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = Auth::user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated or user not found.',
            ], 401);
        }

        try {
            $feedback = UserFeedback::create([
                'user_id' => $user->userID,
                'subject' => trim($request->subject),
                'issue_type' => trim($request->issue_type),
                'message' => trim($request->message),
                'category' => $request->category ? trim($request->category) : null,
                'status' => 'New',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Feedback submitted successfully!',
                'feedback' => $feedback,
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to submit feedback.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get all feedback for Dean and Associate Dean (GET /feedback/admin)
     */
    public function adminIndex(Request $request): JsonResponse
    {
        $user = Auth::user();

        if (!$user || !in_array($user->roleID, [4, 5])) { // Dean and Associate Dean
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Only Dean and Associate Dean can access all feedback.',
            ], 403);
        }

        try {
            $query = UserFeedback::with('user');

            // Filter by status if provided
            if ($request->has('status')) {
                $normalizedStatus = FeedbackStandardizationService::normalizeStatus($request->status);
                $query->status($normalizedStatus);
            }

            // Filter by issue type if provided
            if ($request->has('issue_type')) {
                $normalizedIssueType = FeedbackStandardizationService::normalizeIssueType($request->issue_type);
                $query->issueType($normalizedIssueType);
            }

            // Filter by category if provided
            if ($request->has('category')) {
                $normalizedCategory = FeedbackStandardizationService::normalizeCategory($request->category);
                $query->category($normalizedCategory);
            }

            $feedback = $query->orderBy('created_at', 'desc')->paginate(20);

            return response()->json([
                'success' => true,
                'feedback' => $feedback,
                'available_issue_types' => FeedbackStandardizationService::getAvailableIssueTypes(),
                'available_statuses' => FeedbackStandardizationService::getAvailableStatuses(),
                'available_categories' => FeedbackStandardizationService::getAvailableCategories(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch feedback.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get feedback for Program Chair (GET /feedback/program/:id)
     */
    public function programIndex(Request $request, $programId): JsonResponse
    {
        $user = Auth::user();

        if (!$user || $user->roleID !== 3) { // Only Program Chair
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Only Program Chair can access program feedback.',
            ], 403);
        }

        if ($user->programID != $programId) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. You can only access feedback for your assigned program.',
            ], 403);
        }

        try {
            $query = UserFeedback::with('user')
                ->whereHas('user', function($q) use ($programId) {
                    $q->where('programID', $programId);
                });

            // Apply filters
            if ($request->has('status')) {
                $normalizedStatus = FeedbackStandardizationService::normalizeStatus($request->status);
                $query->status($normalizedStatus);
            }

            if ($request->has('issue_type')) {
                $normalizedIssueType = FeedbackStandardizationService::normalizeIssueType($request->issue_type);
                $query->issueType($normalizedIssueType);
            }

            $feedback = $query->orderBy('created_at', 'desc')->paginate(20);

            return response()->json([
                'success' => true,
                'feedback' => $feedback,
                'program_id' => $programId,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch program feedback.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get feedback for Faculty (GET /feedback/faculty/:id)
     */
    public function facultyIndex(Request $request, $facultyId): JsonResponse
    {
        $user = Auth::user();

        if (!$user || $user->roleID !== 2) { // Only Faculty
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Only Faculty can access faculty feedback.',
            ], 403);
        }

        if ($user->userID != $facultyId) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. You can only access feedback for yourself.',
            ], 403);
        }

        try {
            $query = UserFeedback::with('user')
                ->whereHas('user', function($q) use ($facultyId) {
                    $q->where('userID', $facultyId);
                });

            // Apply filters
            if ($request->has('status')) {
                $normalizedStatus = FeedbackStandardizationService::normalizeStatus($request->status);
                $query->status($normalizedStatus);
            }

            if ($request->has('issue_type')) {
                $normalizedIssueType = FeedbackStandardizationService::normalizeIssueType($request->issue_type);
                $query->issueType($normalizedIssueType);
            }

            $feedback = $query->orderBy('created_at', 'desc')->paginate(20);

            return response()->json([
                'success' => true,
                'feedback' => $feedback,
                'faculty_id' => $facultyId,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch faculty feedback.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get available issue types with sub-options (GET /feedback/issue-types)
     */
    public function getIssueTypesWithSubOptions(Request $request): JsonResponse
    {
        try {
            $preferredOrder = [
                'Account & Login',
                'Exam / Quiz Problem',
                'Technical Issue',
                'Performance & Ranking',
                'Notification Problem',
                'Feature Request',
                'Other Issue',
            ];

            $issueTypes = IssueType::where('is_active', true)
                ->get()
                ->sortBy(function ($issueType) use ($preferredOrder) {
                    $index = array_search($issueType->name, $preferredOrder);
                    return $index === false ? 999 : $index;
                })
                ->map(function ($issueType) {
                    return [
                        'name' => $issueType->name,
                        'description' => $issueType->description,
                        'sub_options' => $this->getSubOptionsForIssueType($issueType->name),
                    ];
                })
                ->values()
                ->toArray();

            return response()->json([
                'success' => true,
                'issue_types' => $issueTypes,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get issue types.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get sub-options for issue type from database
     */
    private function getSubOptionsForIssueType(string $issueType): array
    {
        $issueTypeModel = IssueType::where('name', $issueType)->first();
        if (!$issueTypeModel) {
            return [];
        }
        
        return $issueTypeModel->subOptions()
            ->ordered()
            ->pluck('sub_option')
            ->toArray();
    }

    /**
     * Get issue type details with description (GET /feedback/issue-type-details/{issue_type})
     */
    public function getIssueTypeDetails(Request $request, string $issueType): JsonResponse
    {
        try {
            $normalizedIssueType = FeedbackStandardizationService::normalizeIssueType($issueType);
            
            $issueTypeModel = Modules\Users\Models\IssueType::where('name', $normalizedIssueType)
                ->where('is_active', true)
                ->first();

            if (!$issueTypeModel) {
                return response()->json([
                    'success' => false,
                    'message' => 'Issue type not found.',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'issue_type' => [
                    'name' => $issueTypeModel->name,
                    'description' => $issueTypeModel->description,
                    'is_active' => $issueTypeModel->is_active,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get issue type details.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get all available normalization options (GET /feedback/normalization-options)
     */
    public function getNormalizationOptions(Request $request): JsonResponse
    {
        try {
            return response()->json([
                'success' => true,
                'data' => [
                    'issue_types' => FeedbackStandardizationService::getAvailableIssueTypes(),
                    'statuses' => FeedbackStandardizationService::getAvailableStatuses(),
                    'categories' => FeedbackStandardizationService::getAvailableCategories(),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get normalization options.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Clear normalization cache (POST /feedback/clear-cache) - Dean and Associate Dean
     */
    public function clearNormalizationCache(Request $request): JsonResponse
    {
        $user = Auth::user();

        if (!$user || !in_array($user->roleID, [4, 5])) { // Dean and Associate Dean
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Only Dean and Associate Dean can clear normalization cache.',
            ], 403);
        }

        try {
            FeedbackStandardizationService::clearCache();

            return response()->json([
                'success' => true,
                'message' => 'Normalization cache cleared successfully!',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to clear normalization cache.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
    // Get feedback submitted by the authenticated user (GET /feedback/me)
    public function myFeedback(Request $request): JsonResponse
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        $feedback = UserFeedback::where('user_id', $user->userID)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $feedback,
        ]);
    }

    /**
     * Update feedback status (PATCH /feedback/{id}/status)
     */
    public function updateStatus(Request $request, $id): JsonResponse
    {
        $user = Auth::user();
        if (!$user || !in_array($user->roleID, [4, 5])) {
            return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
        }

        $feedback = UserFeedback::find($id);
        if (!$feedback) {
            return response()->json(['success' => false, 'message' => 'Not found.'], 404);
        }

        $feedback->status = $request->status;
        $feedback->save();

        return response()->json(['success' => true, 'feedback' => $feedback]);
    }
    
}