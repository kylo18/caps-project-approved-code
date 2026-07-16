<?php

namespace Modules\Users\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Modules\Users\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use App\Mail\UserApprovedMail;
use App\Mail\UserDisapprovedMail;
use Illuminate\Validation\Rule;
use Modules\Users\Services\EmailNotificationService;

class UserController extends Controller
{
    protected $emailService;

    public function __construct(EmailNotificationService $emailService)
    {
        $this->emailService = $emailService;
    }

    /**
     * Get all active users (Only Admins can access this).
     */
    public function index(Request $request)
    {
        try {
            $user = Auth::user();

            // Check if user is authenticated
            if (!$user) {
                return response()->json(['message' => 'Unauthenticated'], 401);
            }

            // Check if user has appropriate role
            if (!in_array($user->roleID, [2, 3, 4, 5])) {
                return response()->json(['message' => 'Unauthorized: Insufficient permissions'], 403);
            }

            // Verify faculty has required data
            if ($user->roleID === 2) {
                if (!$user->campusID || !$user->programID) {
                    return response()->json([
                        'message' => 'Faculty account is missing required campus or program assignment'
                    ], 403);
                }
            }

            $query = $this->buildUserQuery($request);

            if ($request->input('ids_only') == '1') {
                $ids = $query->pluck('userID')->toArray();
                return response()->json(['userIDs' => $ids, 'total' => count($ids)], 200);
            }

            $pagination = $this->paginateResults($query, $request);

            return response()->json([
                'users' => $pagination['users'],
                'total' => $pagination['total'],
                'page' => $pagination['page'],
                'totalPages' => $pagination['totalPages']
            ], 200);
        } catch (\Exception $e) {
            Log::error("Error fetching users: " . $e->getMessage());
            return response()->json(['message' => 'An error occurred while fetching users. Please try again later.'], 500);
        }
    }

    /**
     * Update user details (Only Admins or the user themselves).
     */
    public function update(Request $request, $id)
    {
        $authUser = Auth::user();
        $user = User::findOrFail($id);

        if (!$this->canUpdateUser($authUser, $id)) {
            return response()->json(['message' => 'Unauthorized: You can only update your own profile'], 403);
        }

        $user->update($request->only(['firstName', 'lastName', 'email']));
        return response()->json(['message' => 'User updated successfully', 'user' => $user], 200);
    }

    /**
     * Get the authenticated user's full profile.
     */
    public function getProfile()
    {
        try {
            $user = Auth::user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'You are not authenticated. Please log in to view your profile.',
                ], 401);
            }

            $user->load(['role', 'campus', 'program', 'status']);

            return response()->json([
                'success' => true,
                'message' => 'Profile retrieved successfully.',
                'data' => $this->formatUserProfile($user),
            ], 200);
        } catch (\Throwable $e) {
            Log::error('Error retrieving user profile', [
                'user_id' => optional(Auth::user())->userID,
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An error occurred while retrieving your profile. Please try again later.',
                'error' => app()->environment('local') ? $e->getMessage() : null,
            ], 500);
        }
    }

        // Fetch remarks and curriculum for students
        $remarks = null;
        $curriculum = null;
        if ($user->roleID == 1) {
            $remarksRow = \DB::table('student_remarks')
                ->join('remarks', 'student_remarks.remarksID', '=', 'remarks.id')
                ->where('student_remarks.userID', $user->userID)
                ->select('remarks.remarksType')
                ->first();
            $remarks = $remarksRow ? $remarksRow->remarksType : null;
            $curriculumRow = \DB::table('student_curricula')
                ->join('curriculum', 'student_curricula.curriculumID', '=', 'curriculum.id')
                ->where('student_curricula.userID', $user->userID)
                ->select('curriculum.curriculumType')
                ->first();
            $curriculum = $curriculumRow ? $curriculumRow->curriculumType : null;
        }

        return response()->json([
            'userCode' => $user->userCode,
            'email' => $user->email,
            'firstName' => $user->firstName,
            'lastName' => $user->lastName,
            'roleID' => $user->roleID,
            'fullName' => $user->firstName . ' ' . $user->lastName,
            'remarks' => $remarks,
            'curriculum' => $curriculum,
            'programID' => $user->programID,
            'programName' => $user->program?->programName ?? null,
        ], 200);
    }

    /**
     * Deactivate user (Only Dean can do this).
     */
    public function deactivate($id)
    {
        $this->authorizeDeanAccess();
        $user = User::findOrFail($id);
        $user->isActive = false;
        $user->save();

        return response()->json(['message' => 'User deactivated successfully'], 200);
    }

    /**
     * Reactivate user (Only Dean can do this).
     */
    public function activate($id)
    {
        $this->authorizeDeanAccess();
        $user = User::findOrFail($id);
        $user->isActive = true;
        $user->save();

        return response()->json(['message' => 'User reactivated successfully'], 200);
    }

    /**
     * Activate multiple users (Only Dean can do this).
     */
    public function activateMultipleUsers(Request $request)
    {
        $this->authorizeDeanAccess();
        $validated = $this->validateUserIDs($request);

        $activatedUsers = $this->processMultipleUsers($validated['userIDs'], true);

        return response()->json([
            'message' => 'Selected users activated successfully.',
            'activated_users' => $activatedUsers
        ], 200);
    }

    /**
     * Deactivate multiple users (Only Dean can do this).
     */
    public function deactivateMultipleUsers(Request $request)
    {
        $this->authorizeDeanAccess();
        $validated = $this->validateUserIDs($request);

        $deactivatedUsers = $this->processMultipleUsers($validated['userIDs'], false);

        return response()->json([
            'message' => 'Selected users deactivated successfully.',
            'deactivated_users' => $deactivatedUsers
        ], 200);
    }

    /**
     * Approve single user with role-based hierarchy:
     * - Dean (4) can approve all roles
     * - Associate Dean (5) can approve Program Chair (3), Instructor (2), and Student (1) within their campus
     * - Program Chair (3) can approve Instructor (2) and Student (1) ONLY within their assigned program
     * - Faculty (2) can approve Student (1) ONLY for their own students
     */
    public function approveUser(Request $request, $userID)
    {
        try {
            $authUser = Auth::user();
            $user = User::findOrFail($userID);

            // Validate if user has permission to approve
            if (!in_array($authUser->roleID, [2, 3, 4, 5])) {
                return response()->json(['message' => 'Unauthorized. You do not have permission to approve users.'], 403);
            }

            // Check if user is pending
            if (!$this->isUserPending($user)) {
                return response()->json(['message' => 'User is already registered.'], 400);
            }

            // Validate role hierarchy for approval
            if (!$this->canApproveUser($authUser, $user)) {
                return response()->json([
                    'message' => 'You are not authorized to approve users with this role level.'
                ], 403);
            }

            // Validate scope-based restrictions
            if (!$this->canApproveUserInScope($authUser, $user)) {
                return response()->json([
                    'message' => 'You cannot approve users outside your assigned scope. ' .
                        $this->getScopeRestrictionMessage($authUser)
                ], 403);
            }

            $this->updateUserStatus($user, 'registered', true);

            $approverInfo = $this->getApproverInfo($authUser);
            $emailSent = $this->emailService->sendStatusNotification($user, 'approved', $approverInfo['display_name']);
            if (!$emailSent) {
                Log::warning('Approval email failed to send', [
                    'user_id' => $user->userID,
                    'email' => $user->email,
                    'approver_id' => $authUser->userID,
                    'approver_role' => $approverInfo['role'],
                ]);

                return response()->json([
                    'message' => 'User approved, but approval email failed to send.',
                    'user' => $user,
                    'email' => $user->email,
                    'approval_info' => $approverInfo,
                ], 200);
            }

            Log::info('User approved successfully', [
                'user_id' => $user->userID,
                'approver_id' => $authUser->userID,
                'approver_role' => $approverInfo['role'],
                'approver_scope' => $approverInfo['scope'],
            ]);

            return response()->json([
                'message' => 'User approved successfully.',
                'user' => $user,
                'approval_info' => $approverInfo
            ], 200);

        } catch (\Exception $e) {
            Log::error('User approval error: ' . $e->getMessage());
            return response()->json([
                'message' => 'An error occurred while approving the user.'
            ], 500);
        }
    }

    /**
     * Check if the authenticated user can approve the target user based on role hierarchy
     */
    private function canApproveUser($authUser, $targetUser)
    {
        // Dean can approve anyone
        if ($authUser->roleID === 4) {
            return true;
        }

        // Get allowed roles for approval based on auth user's role
        $allowedRoles = $this->getAllowedApprovalRoles($authUser->roleID);

        // Check if target user's role is in the allowed roles
        return in_array($targetUser->roleID, $allowedRoles);
    }

    /**
     * Get the list of roles that can be approved by a given role
     */
    private function getAllowedApprovalRoles($roleID)
    {
        return match ($roleID) {
            4 => [1, 2, 3, 4, 5], // Dean can approve all
            5 => [1, 2, 3],      // Associate Dean can approve Program Chair, Instructor, and Student
            3 => [1, 2],         // Program Chair can approve Instructor and Student
            2 => [1],            // Faculty can approve Student
            default => []
        };
    }

    /**
     * Disapprove user (Only Dean and Associate Dean).
     * Scope restriction: Associate Deans can only disapprove within their campus,
     * but Program Chairs and Faculty cannot disapprove (only Dean/Associate Dean can).
     */
    public function disapproveUser(Request $request, $userID)
    {
        $authUser = Auth::user();

        // Only Dean (4) and Associate Dean (5) can disapprove
        if (!in_array($authUser->roleID, [4, 5])) {
            return response()->json(['message' => 'Unauthorized: Only Dean or Associate Dean can disapprove users.'], 403);
        }

        $user = User::findOrFail($userID);

        // Associate Dean scope check: can only disapprove users in their campus
        if ($authUser->roleID === 5 && $user->campusID !== $authUser->campusID) {
            return response()->json([
                'message' => 'You can only disapprove users within your assigned campus.'
            ], 403);
        }

        $this->updateUserStatus($user, 'disapproved', false);

        $approverInfo = $this->getApproverInfo($authUser);
        $emailSent = $this->emailService->sendStatusNotification($user, 'disapproved', $approverInfo['display_name']);
        if (!$emailSent) {
            Log::warning('Disapproval email failed to send', [
                'user_id' => $user->userID,
                'email' => $user->email,
                'approver_id' => $authUser->userID,
                'approver_role' => $approverInfo['role'],
            ]);

            return response()->json([
                'message' => 'User disapproved, but disapproval email failed to send.',
                'user' => $user,
                'email' => $user->email,
                'approval_info' => $approverInfo,
            ], 200);
        }

        Log::info('User disapproved', [
            'user_id' => $user->userID,
            'approver_id' => $authUser->userID,
            'approver_role' => $approverInfo['role'],
        ]);

        return response()->json([
            'message' => 'User has been disapproved.',
            'user' => $user,
            'approval_info' => $approverInfo
        ], 200);
    }

    /**
     * Approve multiple users at once with role-based scope validation.
     * Dean can approve all, Associate Dean within their campus,
     * Program Chair within their program, Faculty for their students.
     */
    public function approveMultipleUsers(Request $request)
    {
        try {
            $authUser = Auth::user();

            // Only Dean, Associate Dean, Program Chair, and Faculty can bulk approve
            if (!in_array($authUser->roleID, [2, 3, 4, 5])) {
                return response()->json([
                    'message' => 'Unauthorized: You do not have permission to approve users.'
                ], 403);
            }

            $validated = $this->validateUserIDs($request);
            $statusIds = $this->getStatusIds();
            $approverInfo = $this->getApproverInfo($authUser);

            $results = $this->processMultipleApprovalsWithScope(
                $validated['userIDs'],
                $statusIds,
                $authUser,
                $approverInfo
            );

            return response()->json([
                'message' => 'Bulk approval completed.',
                'approved_users' => $results['approved'],
                'skipped_users' => $results['skipped'],
                'scope_restricted_users' => $results['scope_restricted'],
                'approval_info' => $approverInfo
            ], 200);
        } catch (\Exception $e) {
            Log::error('Bulk approval error: ' . $e->getMessage());
            return response()->json([
                'message' => 'An error occurred during bulk approval.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the authenticated user's profile with role-based field restrictions.
     */
    public function updateProfile(Request $request)
    {
        try {
            $user = Auth::user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'You are not authenticated. Please log in to update your profile.',
                ], 401);
            }

            $user = User::with(['role', 'campus', 'program', 'status'])->find($user->userID);

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Your user account could not be found. Please log in again.',
                ], 404);
            }

            if ($restrictionResponse = $this->rejectUnauthorizedProfileFields($request, $user)) {
                return $restrictionResponse;
            }

            $validated = $this->validateProfileUpdate($request, $user);

            if (empty($validated) && !$request->filled('replacementUserID')) {
                return response()->json([
                    'success' => false,
                    'message' => 'No valid fields were provided for update.',
                ], 422);
            }



            $replacementUserID = $request->input('replacementUserID');
            $isDeanSelfDemotion = $user->roleID === 4
                && isset($validated['roleID'])
                && (int) $validated['roleID'] !== 4;

            if ($isDeanSelfDemotion && !$replacementUserID) {
                return response()->json([
                    'success' => false,
                    'requiresReplacement' => true,
                    'message' => 'You are demoting yourself from Dean. Please select a replacement before continuing.',
                    'warning' => 'Dean is the highest position in the system. To step down, you must assign a Faculty, Program Chair, or Associate Dean member to take your place.',
                    'eligibleReplacements' => $this->getEligibleDeanReplacements($user),
                ], 422);
            }

            if ($isDeanSelfDemotion) {
                $demotionError = $this->resolveDeanSelfDemotionError($user, (int) $replacementUserID, $validated);
                if ($demotionError) {
                    return response()->json([
                        'success' => false,
                        'message' => $demotionError,
                    ], 422);
                }
            }

            DB::transaction(function () use ($user, $validated, $isDeanSelfDemotion, $replacementUserID) {
                if ($isDeanSelfDemotion) {
                    $this->processDeanSelfDemotion($user, $validated, (int) $replacementUserID);
                    return;
                }

                $oldUserCode = $user->userCode;
                $this->updateUserProfile($user, $validated);

                if (isset($validated['userCode']) && $validated['userCode'] !== $oldUserCode) {
                    $this->syncUserCodeAcrossTables($oldUserCode, $validated['userCode']);
                }
            });

            $user->refresh()->load(['role', 'campus', 'program', 'status']);

            return response()->json([
                'success' => true,
                'message' => $isDeanSelfDemotion
                    ? 'Profile updated successfully. Your replacement has been promoted to Dean.'
                    : 'Profile updated successfully.',
                'data' => $this->formatUserProfile($user),
            ], 200);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->handleValidationError($e);
        } catch (\Throwable $e) {
            Log::error('Profile update error', [
                'user_id' => optional(Auth::user())->userID,
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            return response()->json([
                'message' => 'An unexpected error occurred while updating your profile.'
            ], 500);
        }
    }

    /**
     * Update credentials of a subordinate user.
     * Dean: Student through Associate Dean (name, user code, email, role, program, campus).
     * Associate Dean: Student through Program Chair in same campus (name, user code, email, program only).
     */
    public function updateUserCredentials(Request $request, $userID)
    {
        try {
            $authUser = Auth::user();

            if (!$authUser) {
                return response()->json([
                    'success' => false,
                    'message' => 'You are not authenticated. Please log in to continue.',
                ], 401);
            }

            if (!in_array($authUser->roleID, [4, 5], true)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized. Only the Dean or Associate Dean can update user credentials.',
                ], 403);
            }

            $targetUser = User::with(['role', 'campus', 'program', 'status'])->find($userID);

            if (!$targetUser) {
                return response()->json([
                    'success' => false,
                    'message' => 'The selected user was not found.',
                ], 404);
            }

            if ($targetUser->userID === $authUser->userID) {
                return response()->json([
                    'success' => false,
                    'message' => 'You cannot update your own credentials through this endpoint. Use profile settings instead.',
                ], 403);
            }

            if ($restrictionResponse = $this->rejectUnauthorizedCredentialFields($request, $authUser)) {
                return $restrictionResponse;
            }

            $authorizationError = $this->resolveCredentialUpdateAuthorizationError($authUser, $targetUser, $request);
            if ($authorizationError) {
                return response()->json([
                    'success' => false,
                    'message' => $authorizationError,
                ], 403);
            }

            $validated = $this->validateSubordinateCredentialUpdate($request, $targetUser, $authUser);

            if (empty($validated)) {
                return response()->json([
                    'success' => false,
                    'message' => 'No valid fields were provided for update.',
                ], 422);
            }

            $effectiveRoleID = $validated['roleID'] ?? $targetUser->roleID;
            $effectiveCampusID = $validated['campusID'] ?? $targetUser->campusID;
            $effectiveProgramID = $validated['programID'] ?? $targetUser->programID;

            if ($authUser->roleID === 4 && isset($validated['roleID'])) {
                $assignableRoles = $this->getAssignableCredentialRoles($authUser->roleID);
                if (!in_array((int) $validated['roleID'], $assignableRoles, true)) {
                    return response()->json([
                        'success' => false,
                        'message' => 'You are not authorized to assign this role.',
                    ], 403);
                }
            }

            if ($authUser->roleID === 4) {
                $slotError = $this->resolveRoleSlotAvailabilityErrorForUser(
                    $targetUser,
                    isset($validated['roleID']) ? (int) $validated['roleID'] : null,
                    isset($validated['campusID']) ? (int) $validated['campusID'] : null,
                    isset($validated['programID']) ? (int) $validated['programID'] : null
                );

                if ($slotError) {
                    return response()->json([
                        'success' => false,
                        'message' => $slotError,
                    ], 422);
                }
            }

            $resultingRoleID = $authUser->roleID === 4 ? $effectiveRoleID : $targetUser->roleID;

            DB::transaction(function () use ($targetUser, $validated) {
                $oldUserCode = $targetUser->userCode;

                foreach ($validated as $field => $value) {
                    $targetUser->$field = $value;
                }

                $targetUser->save();

                if (isset($validated['userCode']) && $validated['userCode'] !== $oldUserCode) {
                    $this->syncUserCodeAcrossTables($oldUserCode, $validated['userCode']);
                }
            });

            $targetUser->refresh()->load(['role', 'campus', 'program', 'status']);

            return response()->json([
                'success' => true,
                'message' => 'User credentials updated successfully.',
                'data' => $this->formatUserProfile($targetUser),
            ], 200);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->handleValidationError($e);
        } catch (\Throwable $e) {
            Log::error('User credentials update error', [
                'auth_user_id' => optional(Auth::user())->userID,
                'target_user_id' => $userID,
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            return response()->json([
                'message' => 'User role updated successfully',
                'user' => $user
            ], 200);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'message' => 'User not found'
            ], 404);
        } catch (\Exception $e) {
            Log::error('Role change error: ' . $e->getMessage());
            return response()->json([
                'message' => 'An unexpected error occurred while changing the user role'
            ], 500);
        }
    }

    /**
     * Delete a specific user (Only Dean and Associate Dean).
     */
    public function deleteUser($id)
    {
        $authUser = Auth::user();
        if (!in_array($authUser->roleID, [4, 5])) {
            return response()->json(['message' => 'Unauthorized: Only the Dean or Associate Dean can delete users'], 403);
        }
        $user = User::find($id);
        if (!$user) {
            return response()->json(['message' => 'User not found'], 404);
        }
        $user->delete();
        return response()->json(['message' => 'User deleted successfully'], 200);
    }

    /**
     * Delete multiple users (Only Dean and Associate Dean).
     */
    public function deleteMultipleUsers(Request $request)
    {
        $authUser = Auth::user();
        if (!in_array($authUser->roleID, [4, 5])) {
            return response()->json(['message' => 'Unauthorized: Only the Dean or Associate Dean can delete users'], 403);
        }
        $validated = $request->validate([
            'userIDs' => 'required|array',
            'userIDs.*' => 'integer|exists:users,userID'
        ]);
        $deleted = [];
        foreach ($validated['userIDs'] as $userID) {
            $user = User::find($userID);
            if ($user) {
                $user->delete();
                $deleted[] = $userID;
            }
        }
        return response()->json([
            'message' => 'Selected users deleted successfully.',
            'deleted_users' => $deleted
        ], 200);
    }
    /**
     * Get count of pending users (Only Admins can access this).
     */
    public function getPendingUsersCount(Request $request)
    {
        try {
            $user = Auth::user();

            // Check if user is authenticated
            if (!$user) {
                return response()->json(['message' => 'Unauthenticated'], 401);
            }

            // Check if user has appropriate role (Faculty, Program Chair, Dean, Associate Dean)
            if (!in_array($user->roleID, [2, 3, 4, 5])) {
                return response()->json(['message' => 'Unauthorized: Insufficient permissions'], 403);
            }

            // Get pending status ID
            $pendingStatusId = DB::table('statuses')->where('name', 'pending')->first()?->id;

            if (!$pendingStatusId) {
                return response()->json(['count' => 0], 200);
            }

            // Build query based on role
            $query = User::where('status_id', $pendingStatusId);

            // Faculty can see pending users from their own campus/program
            if ($user->roleID === 2) {
                if ($user->campusID && $user->programID) {
                    $query->whereHas('student', function ($q) use ($user) {
                        $q->where('programID', $user->programID);
                    })->orWhere(function ($q) use ($user) {
                        $q->where('roleID', 1)
                            ->where('programID', $user->programID);
                    });
                } else {
                    return response()->json(['count' => 0], 200);
                }
            }
            // Program Chair can see pending users from their program
            else if ($user->roleID === 3) {
                $query->where(function ($q) use ($user) {
                    $q->where('programID', $user->programID)
                        ->orWhereHas('student', function ($subQ) use ($user) {
                            $subQ->where('programID', $user->programID);
                        });
                });
            }
            // Associate Dean and Dean can see all pending users from their campus
            else if ($user->roleID === 5) {
                $query->where('campusID', $user->campusID);
            }
            // Dean can see all pending users

            $count = $query->count();

            return response()->json(['count' => $count], 200);
        } catch (\Exception $e) {
            Log::error("Error fetching pending users count: " . $e->getMessage());
            return response()->json(['count' => 0], 200);
        }
    }

    // Private helper methods

    private function authorizeDeanAccess()
    {
        $authUser = Auth::user();
        if (!in_array($authUser->roleID, [3, 4, 5])) {
            return response()->json(['message' => 'Unauthorized: Only the Dean or Associate Dean can perform this action'], 403);
        }
    }

    private function buildUserQuery(Request $request)
    {
        $query = User::with(['role', 'campus', 'program', 'status']);
        $user = Auth::user();

        // Apply role-based filters
        if ($user->roleID === 5) {
            // Associate Dean can only view users from their campus
            if ($user->campusID) {
                $query->where('campusID', $user->campusID);
            } else {
                Log::warning("Associate Dean {$user->userID} has no campus assigned");
                $query->where('campusID', 0); // This will return no results
            }
        } elseif ($user->roleID === 3) {
            // Program Chair can only view users from their campus and program
            if ($user->campusID && $user->programID) {
                $query->where('campusID', $user->campusID)
                    ->where('programID', $user->programID);
            } else {
                Log::warning("Program Chair {$user->userID} has missing campus or program assignment");
                $query->where('campusID', 0); // This will return no results
            }
        } elseif ($user->roleID === 2) {
            // Faculty can only view students from their campus and program
            if ($user->campusID && $user->programID) {
                $query->where('campusID', $user->campusID)
                    ->where('programID', $user->programID)
                    ->where('roleID', 1); // Only show students (roleID 1)
            } else {
                Log::warning("Faculty {$user->userID} has missing campus or program assignment");
                $query->where('campusID', 0); // This will return no results
            }
        }
        // Dean (roleID 4) can view all users, so no additional filters needed

        $this->applySearchFilters($query, $request);
        return $query;
    }

    private function applySearchFilters($query, Request $request)
    {
        $filters = [
            'search' => function ($q, $value) {
                $q->where(function ($q) use ($value) {
                    $q->where('firstName', 'like', "%{$value}%")
                        ->orWhere('lastName', 'like', "%{$value}%")
                        ->orWhere('email', 'like', "%{$value}%")
                        ->orWhere('userCode', 'like', "%{$value}%");
                });
            },
            'status' => function ($q, $value) {
                if ($value && $value !== 'all') {
                    $q->whereHas('status', function ($q) use ($value) {
                        $q->where('name', $value);
                    });
                }
            },
            'campus' => function ($q, $value) {
                $q->whereHas('campus', function ($q) use ($value) {
                    $q->where('campusName', $value);
                });
            },
            'role' => function ($q, $value) {
                $roles = explode(',', $value);
                $q->whereHas('role', function ($q) use ($roles) {
                    $q->whereIn('roleName', $roles);
                });
            },
            'position' => function ($q, $value) {
                $roles = explode(',', $value);
                $q->whereHas('role', function ($q) use ($roles) {
                    $q->whereIn('roleName', $roles);
                });
            },
            'program' => function ($q, $value) {
                $q->whereHas('program', function ($q) use ($value) {
                    $q->where('programName', $value);
                });
            },
            'yearLevel' => function ($q, $value) {
                $q->whereHas('student', function ($q) use ($value) {
                    $q->where('yearLevel', $value);
                });
            },
            'state' => function ($q, $value) {
                $q->where('isActive', $value === 'Active');
            }
        ];

        foreach ($filters as $key => $callback) {
            if ($value = $request->input($key)) {
                $callback($query, $value);
            }
        }
    }

    private function paginateResults($query, Request $request)
    {
        $perPage = min((int) $request->input('limit', 20), 100); // Default 20, max 100
        $page = max((int) $request->input('page', 1), 1);
        $total = $query->count();

        $users = $query->with('student')->orderBy('userID', 'desc')
            ->skip(($page - 1) * $perPage)
            ->take($perPage)
            ->get()
            ->map(function ($user) {
                // Fetch remarks and curriculum for students
                $remarks = null;
                $curriculum = null;
                if ($user->roleID == 1) {
                    $remarksRow = \DB::table('student_remarks')
                        ->join('remarks', 'student_remarks.remarksID', '=', 'remarks.id')
                        ->where('student_remarks.userID', $user->userID)
                        ->select('remarks.remarksType')
                        ->first();
                    $remarks = $remarksRow ? $remarksRow->remarksType : null;
                    $curriculumRow = \DB::table('student_curricula')
                        ->join('curriculum', 'student_curricula.curriculumID', '=', 'curriculum.id')
                        ->where('student_curricula.userID', $user->userID)
                        ->select('curriculum.curriculumType')
                        ->first();
                    $curriculum = $curriculumRow ? $curriculumRow->curriculumType : null;
                }
                return [
                    'userID' => $user->userID,
                    'userCode' => $user->userCode,
                    'firstName' => $user->firstName,
                    'lastName' => $user->lastName,
                    'email' => $user->email,
                    'roleID' => $user->roleID,
                    'campusID' => $user->campusID,
                    'programID' => $user->programID,
                    'role' => $user->role ? $user->role->roleName : 'Unknown',
                    'campus' => $user->campus ? $user->campus->campusName : 'Unknown',
                    'program' => $user->program ? $user->program->programName : 'Not Assigned',
                    'isActive' => $user->isActive,
                    'status_id' => $user->status_id,
                    'status' => $user->status ? $user->status->name : 'Unknown',
                    'remarks' => $remarks,
                    'curriculum' => $curriculum,
                    'yearLevel' => $user->student?->yearLevel ?? null,
                ];
            });

        return [
            'users' => $users,
            'total' => $total,
            'page' => (int) $page,
            'totalPages' => ceil($total / $perPage)
        ];
    }

    private function formatUserProfile(User $user): array
    {
        $roleName = $user->role ? $user->role->roleName : 'Unknown';

        return [
            'userID' => $user->userID,
            'userCode' => $user->userCode,
            'firstName' => $user->firstName,
            'lastName' => $user->lastName,
            'fullName' => trim($user->firstName . ' ' . $user->lastName),
            'email' => $user->email,
            'roleID' => $user->roleID,
            'role' => $roleName === 'Instructor' ? 'Faculty' : $roleName,
            'campusID' => $user->campusID,
            'campus' => $user->campus ? $user->campus->campusName : 'Unknown',
            'programID' => $user->programID,
            'program' => $user->program ? $user->program->programName : 'Not Assigned',
            'isActive' => (bool) $user->isActive,
            'status_id' => $user->status_id,
            'status' => $user->status ? $user->status->name : 'Unknown',
            'created_at' => $user->created_at?->toDateTimeString(),
            'updated_at' => $user->updated_at?->toDateTimeString(),
        ];
    }

    private function canUpdateUser($authUser, $userId)
    {
        return $authUser->roleID < 3 || $authUser->userID == $userId;
    }

    private function validateUserIDs(Request $request)
    {
        return $request->validate([
            'userIDs' => 'required|array',
            'userIDs.*' => 'integer|exists:users,userID'
        ]);
    }

    private function processMultipleUsers($userIDs, $activate)
    {
        $processedUsers = [];
        foreach ($userIDs as $userID) {
            $user = User::find($userID);
            if ($user && $user->isActive !== $activate) {
                $user->isActive = $activate;
                $user->save();
                $processedUsers[] = $userID;
            }
        }
        return $processedUsers;
    }

    private function isUserPending($user)
    {
        $pendingStatusId = DB::table('statuses')->where('name', 'pending')->first()->id;
        return $user->status_id === $pendingStatusId;
    }

    private function updateUserStatus($user, $status, $isActive)
    {
        $statusId = DB::table('statuses')->where('name', $status)->first()->id;
        $user->update([
            'status_id' => $statusId,
            'isActive' => $isActive
        ]);
    }

    private function getStatusIds()
    {
        return [
            'pending' => DB::table('statuses')->where('name', 'pending')->first()->id,
            'registered' => DB::table('statuses')->where('name', 'registered')->first()->id,
            'disapproved' => DB::table('statuses')->where('name', 'disapproved')->first()->id
        ];
    }

    private function processMultipleApprovals($userIDs, $statusIds, $approverName = 'The Dean')
    {
        $approved = [];
        $skipped = [];

        foreach ($userIDs as $userID) {
            $user = User::find($userID);
            if (!$user || $user->status_id === $statusIds['disapproved'] || $user->status_id !== $statusIds['pending']) {
                $skipped[] = $userID;
                continue;
            }

            $user->update([
                'status_id' => $statusIds['registered'],
                'isActive' => true
            ]);

            // Send email notification
            $this->emailService->sendStatusNotification($user, 'approved', $approverName);

            $approved[] = $user;
        }

        return ['approved' => $approved, 'skipped' => $skipped];
    }

    /**
     * Process multiple user approvals with scope validation
     * Filters users based on approver's authority and scope
     */
    private function processMultipleApprovalsWithScope($userIDs, $statusIds, $authUser, $approverInfo)
    {
        $approved = [];
        $skipped = [];
        $scopeRestricted = [];

        foreach ($userIDs as $userID) {
            $user = User::find($userID);

            // Check if user exists and is pending
            if (!$user || $user->status_id !== $statusIds['pending']) {
                $skipped[] = [
                    'userID' => $userID,
                    'reason' => 'User not found or not pending'
                ];
                continue;
            }

            // Check role hierarchy
            if (!$this->canApproveUser($authUser, $user)) {
                $skipped[] = [
                    'userID' => $userID,
                    'reason' => 'Insufficient role authority'
                ];
                continue;
            }

            // Check scope restrictions
            if (!$this->canApproveUserInScope($authUser, $user)) {
                $scopeRestricted[] = [
                    'userID' => $userID,
                    'reason' => $this->getScopeRestrictionMessage($authUser)
                ];
                continue;
            }

            // Approve the user
            $user->update([
                'status_id' => $statusIds['registered'],
                'isActive' => true
            ]);

            // Send email notification with approver info
            $this->emailService->sendStatusNotification(
                $user,
                'approved',
                $approverInfo['display_name']
            );

            $approved[] = $user;

            Log::info('User approved in bulk', [
                'user_id' => $user->userID,
                'approver_id' => $authUser->userID,
                'approver_role' => $approverInfo['role'],
            ]);
        }

        return [
            'approved' => $approved,
            'skipped' => $skipped,
            'scope_restricted' => $scopeRestricted
        ];
    }

    private function validateProfileUpdate(Request $request, $user)
    {
        $rules = [
            'firstName' => 'sometimes|required|string|max:100',
            'lastName' => 'sometimes|required|string|max:100',
            'email' => [
                'sometimes',
                'required',
                'email',
                Rule::unique('users', 'email')->ignore($user->userID, 'userID')
            ],
            // userCode is intentionally NOT updatable via the self-service profile
            // update. It is omitted from the rules so any submitted value is ignored
            // (never validated, never applied) and the user's code stays fixed.
        ];

        if ($user->roleID === 4) {
            $rules['campusID'] = 'sometimes|required|integer|exists:campuses,campusID';
            $rules['programID'] = 'sometimes|required|integer|exists:programs,programID';
            $rules['roleID'] = 'sometimes|required|integer|exists:roles,roleID';
            $rules['replacementUserID'] = 'sometimes|integer|exists:users,userID';
        }

        return $request->validate($rules);
    }

    private function updateUserProfile($user, $validated)
    {
        if (!$user instanceof User) {
            $eloquentUser = User::find($user->userID);
            if (!$eloquentUser) {
                throw new \Exception('User record not found.');
            }
            foreach ($validated as $field => $value) {
                $eloquentUser->$field = $value;
            }
            $eloquentUser->save();
        } else {
            foreach ($validated as $field => $value) {
                $user->$field = $value;
            }
            $user->save();
        }
    }

    private function handleValidationError($e)
    {
        $customErrors = [];
        $topMessage = 'Validation failed.';
        if (isset($e->errors()['email'])) {
            $customErrors['email'] = ['The email is already in use by another account.'];
            $topMessage = 'The email is already in use by another account.';
        }
        if (isset($e->errors()['userCode'])) {
            $customErrors['userCode'] = ['The user code is already taken.'];
            $topMessage = 'The user code is already taken.';
        }
        return response()->json([
            'message' => $topMessage,
            'errors' => count($customErrors) ? $customErrors : $e->errors()
        ], 422);
    }

    private function getManageableTargetRoles(int $authRoleID): array
    {
        return match ($roleID) {
            4 => [1, 2, 3, 4, 5], // Dean can change all roles
            5 => [1, 2, 3],      // Associate Dean can change Program Chair, Instructor, and Student
            3 => [1, 2],         // Program Chair can change Instructor and Student
            default => []
        };
    }

    private function getApproverDisplayName($user)
    {
        $approverName = $user->firstName . ' ' . $user->lastName;

        // Add role and program information
        $roleNames = [
            1 => 'Student',
            2 => 'Instructor',
            3 => 'Program Chair',
            4 => 'Dean',
            5 => 'Associate Dean'
        ];

        $roleName = $roleNames[$user->roleID] ?? 'Administrator';

        // For Program Chair and Instructor, include program name
        if (in_array($user->roleID, [2, 3]) && $user->program) {
            $programName = $user->program->programName ?? '';
            return "{$approverName} - {$programName} {$roleName}";
        }

        // For Dean and Associate Dean, just show role
        if (in_array($user->roleID, [4, 5])) {
            return $roleName;
        }

        return $approverName;
    }

    /**
     * Get comprehensive approver information including role, scope, and display name
     * Provides transparency about who approved and their authority level
     */
    private function getApproverInfo($user)
    {
        $roleNames = [
            1 => 'Student',
            2 => 'Faculty/Instructor',
            3 => 'Program Chair',
            4 => 'Dean',
            5 => 'Associate Dean'
        ];

        $roleName = $roleNames[$user->roleID] ?? 'Administrator';

        $displayName = $user->firstName . ' ' . $user->lastName;
        $campusName = $user->campus ? $user->campus->campusName : 'N/A';
        $programName = $user->program ? $user->program->programName : 'N/A';

        $info = [
            'approver_id' => $user->userID,
            'approver_name' => $displayName,
            'role' => $roleName,
            'campus' => $campusName,
            'program' => $programName,
            'display_name' => $displayName . ' (' . $roleName . ')',
            'scope' => $this->getApproverScope($user)
        ];

        // Build detailed display name with scope information
        if ($user->roleID === 4) {
            $info['display_name'] = $displayName . ' - Dean (Full Authority)';
        } elseif ($user->roleID === 5) {
            $info['display_name'] = $displayName . ' - Associate Dean (' . $campusName . ' Campus)';
        } elseif ($user->roleID === 3) {
            $info['display_name'] = $displayName . ' - Program Chair (' . $programName . ')';
        } elseif ($user->roleID === 2) {
            $info['display_name'] = $displayName . ' - Faculty (' . $programName . ')';
        }

        return $info;
    }

    /**
     * Get the scope of authority for an approver
     */
    private function getApproverScope($user)
    {
        switch ($user->roleID) {
            case 4:
                return 'Institution-wide Authority';
            case 5:
                return 'Campus: ' . ($user->campus ? $user->campus->campusName : 'Unassigned');
            case 3:
                return 'Program: ' . ($user->program ? $user->program->programName : 'Unassigned');
            case 2:
                return 'Students in: ' . ($user->program ? $user->program->programName : 'Unassigned');
            default:
                return 'Limited Authority';
        }
    }

    /**
     * Check if approver can approve user within their assigned scope
     * - Program Chairs can ONLY approve within their assigned program
     * - Faculty can ONLY approve their own students
     * - Deans have no scope restrictions
     */
    private function canApproveUserInScope($authUser, $targetUser)
    {
        // Dean has full authority, no scope restrictions
        if ($authUser->roleID === 4) {
            return true;
        }

        // Associate Dean can approve users in their campus
        if ($authUser->roleID === 5) {
            return $targetUser->campusID === $authUser->campusID;
        }

        // Program Chair can ONLY approve users within their assigned program
        if ($authUser->roleID === 3) {
            return $targetUser->programID === $authUser->programID &&
                $targetUser->campusID === $authUser->campusID;
        }

        // Faculty can ONLY approve students (roleID 1) in their program
        if ($authUser->roleID === 2) {
            return $targetUser->roleID === 1 && // Only students
                $targetUser->programID === $authUser->programID &&
                $targetUser->campusID === $authUser->campusID;
        }

        return false;
    }

    /**
     * Get user-friendly scope restriction message for error responses
     */
    private function getScopeRestrictionMessage($authUser)
    {
        switch ($authUser->roleID) {
            case 3: // Program Chair
                $programName = $authUser->program ? $authUser->program->programName : 'your assigned program';
                return "As a Program Chair, you can only approve users within {$programName}.";
            case 2: // Faculty
                $programName = $authUser->program ? $authUser->program->programName : 'your assigned program';
                return "As Faculty, you can only approve students within {$programName}.";
            case 5: // Associate Dean
                $campusName = $authUser->campus ? $authUser->campus->campusName : 'your assigned campus';
                return "As an Associate Dean, you can only approve users within {$campusName}.";
            default:
                return "You do not have authority to approve this user.";
        }
    }
}
