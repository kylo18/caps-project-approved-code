<?php

namespace Modules\Users\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Modules\Users\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Carbon\Carbon;

class UserController extends Controller
{
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

    /**
     * Send a user code reset link to the user's email.
     * Mirrors the forgot-password flow but for updating userCode.
     */
    public function sendUserCodeResetLinkEmail(Request $request)
    {
        try {
            $request->validate(['email' => 'required|email']);

            Log::info('Attempting to send user code reset link to: ' . $request->email);

            $user = User::where('email', $request->email)->first();

            if (!$user) {
                return response()->json([
                    'message' => 'Unable to send reset link. Please check if the email is registered.',
                ], 422);
            }

            if ($this->isUserCodeResetThrottled($request->email)) {
                return response()->json([
                    'message' => 'Please wait a moment before requesting another user code reset link.',
                ], 429);
            }

            $token = $this->createUserCodeResetToken($user);
            $user->sendUserCodeResetNotification($token);

            Log::info('User code reset link sent to: ' . $request->email);

            return response()->json([
                'message' => 'User code reset link has been sent to your email.',
            ], 200);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Throwable $e) {
            Log::error('Error sending user code reset link', [
                'email' => $request->input('email'),
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'An error occurred while sending the user code reset link.',
                'error' => app()->environment('local') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Reset the user's userCode using the emailed token.
     * Mirrors the reset-password flow but updates userCode instead.
     */
    public function resetUserCode(Request $request)
    {
        try {
            $validated = $request->validate([
                'token' => 'required|string',
                'email' => 'required|email|exists:users,email',
                'userCode' => 'required|string|max:20',
                'userCode_confirmation' => 'required|same:userCode',
            ]);

            $user = User::where('email', $validated['email'])->firstOrFail();

            $tokenError = $this->validateUserCodeResetToken($validated['email'], $validated['token']);
            if ($tokenError) {
                return response()->json(['message' => $tokenError], 422);
            }

            if (User::where('userCode', $validated['userCode'])->where('userID', '!=', $user->userID)->exists()) {
                return response()->json([
                    'message' => 'This user code is already in use by another account.',
                ], 422);
            }

            if ($user->userCode === $validated['userCode']) {
                return response()->json([
                    'message' => 'The new user code must be different from your current user code.',
                ], 422);
            }

            DB::transaction(function () use ($user, $validated) {
                $oldUserCode = $user->userCode;
                $newUserCode = $validated['userCode'];

                $user->userCode = $newUserCode;
                $user->save();

                $this->syncUserCodeAcrossTables($oldUserCode, $newUserCode);

                DB::table('user_code_reset_tokens')->where('email', $validated['email'])->delete();
            });

            Log::info('User code reset successfully for email: ' . $validated['email']);

            return response()->json([
                'message' => 'User code has been reset successfully.',
                'userCode' => $validated['userCode'],
            ], 200);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Throwable $e) {
            Log::error('User code reset error', [
                'email' => $request->input('email'),
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'An error occurred while resetting your user code.',
                'error' => app()->environment('local') ? $e->getMessage() : null,
            ], 500);
        }
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
     * - Associate Dean (5) can approve Program Chair (3), Instructor (2), and Student (1)
     * - Program Chair (3) can approve Instructor (2) and Student (1)
     * - Faculty (2) can approve Student (1)
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

            $this->updateUserStatus($user, 'registered', true);
            return response()->json(['message' => 'User approved successfully.', 'user' => $user], 200);

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
        return match($roleID) {
            4 => [1, 2, 3, 4, 5], // Dean can approve all
            5 => [1, 2, 3],      // Associate Dean can approve Program Chair, Instructor, and Student
            3 => [1, 2],         // Program Chair can approve Instructor and Student
            2 => [1],            // Faculty can approve Student
            default => []
        };
    }

    /**
     * Disapprove user (Only Dean).
     */
    public function disapproveUser(Request $request, $userID)
    {
        $this->authorizeDeanAccess();
        $user = User::findOrFail($userID);

        $this->updateUserStatus($user, 'disapproved', false);
        return response()->json(['message' => 'User has been disapproved.', 'user' => $user], 200);
    }

    /**
     * Approve multiple users at once (Only Dean).
     */
    public function approveMultipleUsers(Request $request)
    {
        $this->authorizeDeanAccess();
        $validated = $this->validateUserIDs($request);

        $statusIds = $this->getStatusIds();
        $results = $this->processMultipleApprovals($validated['userIDs'], $statusIds);

        return response()->json([
            'message' => 'Bulk approval completed.',
            'approved_users' => $results['approved'],
            'skipped_users' => $results['skipped']
        ], 200);
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
            'search' => function($q, $value) {
                $q->where(function($q) use ($value) {
                    $q->where('firstName', 'like', "%{$value}%")
                      ->orWhere('lastName', 'like', "%{$value}%")
                      ->orWhere('email', 'like', "%{$value}%")
                      ->orWhere('userCode', 'like', "%{$value}%");
                });
            },
            'status' => function($q, $value) {
                if ($value && $value !== 'all') {
                    $q->whereHas('status', function($q) use ($value) {
                        $q->where('name', $value);
                    });
                }
            },
            'campus' => function($q, $value) {
                $q->whereHas('campus', function($q) use ($value) {
                    $q->where('campusName', $value);
                });
            },
            'role' => function($q, $value) {
                $q->whereHas('role', function($q) use ($value) {
                    $q->where('roleName', $value);
                });
            },
            'position' => function($q, $value) {
                $q->whereHas('role', function($q) use ($value) {
                    $q->where('roleName', $value);
                });
            },
            'program' => function($q, $value) {
                $q->whereHas('program', function($q) use ($value) {
                    $q->where('programName', $value);
                });
            },
            'state' => function($q, $value) {
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
        $perPage = $request->input('limit', 50);
        $page = $request->input('page', 1);
        $total = $query->count();

        $users = $query->orderBy('userID', 'desc')
                      ->skip(($page - 1) * $perPage)
                      ->take($perPage)
                      ->get()
                      ->map(function ($user) {
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
                          ];
                      });

        return [
            'users' => $users,
            'total' => $total,
            'page' => (int)$page,
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

    private function processMultipleApprovals($userIDs, $statusIds)
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

            $approved[] = $user;
        }

        return ['approved' => $approved, 'skipped' => $skipped];
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
            'userCode' => [
                'sometimes',
                'required',
                'string',
                'max:50',
                Rule::unique('users', 'userCode')->ignore($user->userID, 'userID')
            ],
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
        return match ($authRoleID) {
            4 => [1, 2, 3, 5],
            5 => [1, 2, 3],
            default => [],
        };
    }

    private function getEditableCredentialFields(int $authRoleID): array
    {
        return match ($authRoleID) {
            4 => ['firstName', 'lastName', 'userCode', 'email', 'roleID', 'programID', 'campusID'],
            5 => ['firstName', 'lastName', 'userCode', 'email', 'programID'],
            default => [],
        };
    }

    private function getAssignableCredentialRoles(int $authRoleID): array
    {
        return match ($authRoleID) {
            4 => [1, 2, 3, 5],
            default => [],
        };
    }

    private function rejectUnauthorizedProfileFields(Request $request, User $user): ?\Illuminate\Http\JsonResponse
    {
        $alwaysRestricted = ['password', 'status_id', 'status', 'isActive'];

        foreach ($alwaysRestricted as $field) {
            if ($request->has($field)) {
                return response()->json([
                    'success' => false,
                    'message' => "The {$field} field cannot be updated through this endpoint.",
                ], 422);
            }
        }

        // Fields all users can edit on their own profile
        $allowedFields = ['firstName', 'lastName', 'email', 'userCode'];

        // Dean can also edit campus, program, role, and specify a replacement
        if ($user->roleID === 4) {
            $allowedFields = array_merge($allowedFields, ['campusID', 'programID', 'roleID', 'replacementUserID']);
        }

        foreach (array_keys($request->all()) as $field) {
            if (!in_array($field, $allowedFields, true)) {
                return response()->json([
                    'success' => false,
                    'message' => "You are not allowed to update the {$field} field.",
                ], 422);
            }
        }

        return null;
    }

    private function getAlwaysRestrictedCredentialFields(): array
    {
        return ['password', 'status_id', 'status', 'isActive'];
    }

    private function rejectUnauthorizedCredentialFields(Request $request, User $authUser): ?\Illuminate\Http\JsonResponse
    {
        foreach ($this->getAlwaysRestrictedCredentialFields() as $field) {
            if ($request->has($field)) {
                return response()->json([
                    'success' => false,
                    'message' => "The {$field} field cannot be updated through this endpoint.",
                ], 422);
            }
        }

        $allowedFields = $this->getEditableCredentialFields($authUser->roleID);

        foreach (array_keys($request->all()) as $field) {
            if (!in_array($field, $allowedFields, true)) {
                if ($authUser->roleID === 5 && in_array($field, ['roleID', 'campusID'], true)) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Associate Deans cannot change a user\'s role or campus.',
                    ], 422);
                }

                return response()->json([
                    'success' => false,
                    'message' => "You are not allowed to update the {$field} field.",
                ], 422);
            }
        }

        return null;
    }

    private function resolveCredentialUpdateAuthorizationError(User $authUser, User $targetUser, Request $request): ?string
    {
        $manageableRoles = $this->getManageableTargetRoles($authUser->roleID);

        if (!in_array($targetUser->roleID, $manageableRoles, true)) {
            return $authUser->roleID === 4
                ? 'You can only update credentials for users from Student through Associate Dean.'
                : 'You can only update credentials for users from Student through Program Chair in your campus.';
        }

        if ($authUser->roleID === 5 && $targetUser->campusID !== $authUser->campusID) {
            return 'You can only update credentials for users assigned to your campus.';
        }

        if ($authUser->roleID === 5 && ($request->has('roleID') || $request->has('campusID'))) {
            return 'Associate Deans cannot change a user\'s role or campus.';
        }

        return null;
    }

    private function validateSubordinateCredentialUpdate(Request $request, User $targetUser, User $authUser): array
    {
        $rules = [
            'firstName' => 'sometimes|required|string|max:100',
            'lastName' => 'sometimes|required|string|max:100',
            'email' => [
                'sometimes',
                'required',
                'email',
                'max:100',
                Rule::unique('users', 'email')->ignore($targetUser->userID, 'userID'),
            ],
            'userCode' => [
                'sometimes',
                'required',
                'string',
                'max:20',
                Rule::unique('users', 'userCode')->ignore($targetUser->userID, 'userID'),
            ],
            'programID' => 'sometimes|required|integer|exists:programs,programID',
        ];

        if ($authUser->roleID === 4) {
            $rules['roleID'] = 'sometimes|required|integer|exists:roles,roleID|in:1,2,3,5';
            $rules['campusID'] = 'sometimes|required|integer|exists:campuses,campusID';
        }

        $validated = $request->validate($rules);

        return array_intersect_key($validated, array_flip($this->getEditableCredentialFields($authUser->roleID)));
    }

    private function resolveRoleSlotAvailabilityErrorForUser(
        User $targetUser,
        ?int $newRoleID,
        ?int $newCampusID,
        ?int $newProgramID
    ): ?string {
        $roleID = $newRoleID ?? $targetUser->roleID;
        $campusID = $newCampusID ?? $targetUser->campusID;
        $programID = $newProgramID ?? $targetUser->programID;

        if ($roleID === 5) {
            $associateDeanExists = User::where('roleID', 5)
                ->where('campusID', $campusID)
                ->where('userID', '!=', $targetUser->userID)
                ->exists();

            if ($associateDeanExists) {
                return 'Only one Associate Dean is allowed per campus.';
            }
        }

        if ($roleID === 3) {
            $programChairExists = User::where('roleID', 3)
                ->where('campusID', $campusID)
                ->where('programID', $programID)
                ->where('userID', '!=', $targetUser->userID)
                ->exists();

            if ($programChairExists) {
                return 'Only one Program Chair is allowed per program and campus.';
            }
        }

        return null;
    }

    private function createUserCodeResetToken(User $user): string
    {
        $token = Str::random(64);

        DB::table('user_code_reset_tokens')->updateOrInsert(
            ['email' => $user->email],
            [
                'token' => Hash::make($token),
                'created_at' => now(),
            ]
        );

        return $token;
    }

    private function validateUserCodeResetToken(string $email, string $token): ?string
    {
        $record = DB::table('user_code_reset_tokens')->where('email', $email)->first();

        if (!$record) {
            return 'User code reset failed. No reset request was found for this email.';
        }

        if (!Hash::check($token, $record->token)) {
            return 'User code reset failed. The token is invalid.';
        }

        $expireMinutes = (int) config('auth.passwords.users.expire', 60);
        if (Carbon::parse($record->created_at)->addMinutes($expireMinutes)->isPast()) {
            DB::table('user_code_reset_tokens')->where('email', $email)->delete();

            return 'User code reset failed. The token has expired. Please request a new reset link.';
        }

        return null;
    }

    private function isUserCodeResetThrottled(string $email): bool
    {
        $record = DB::table('user_code_reset_tokens')->where('email', $email)->first();

        if (!$record || !$record->created_at) {
            return false;
        }

        $throttleSeconds = (int) config('auth.passwords.users.throttle', 60);

        return Carbon::parse($record->created_at)->addSeconds($throttleSeconds)->isFuture();
    }

    private function syncUserCodeAcrossTables(string $oldUserCode, string $newUserCode): void
    {
        if (Schema::hasTable('students')) {
            $newCodeExistsInStudents = DB::table('students')->where('userCode', $newUserCode)->exists();
            if (!$newCodeExistsInStudents && DB::table('students')->where('userCode', $oldUserCode)->exists()) {
                DB::table('students')->where('userCode', $oldUserCode)->update(['userCode' => $newUserCode]);
            }
        }

        if (Schema::hasTable('student_grades')) {
            $newCodeExistsInGrades = DB::table('student_grades')->where('userCode', $newUserCode)->exists();
            if (!$newCodeExistsInGrades && DB::table('student_grades')->where('userCode', $oldUserCode)->exists()) {
                DB::table('student_grades')->where('userCode', $oldUserCode)->update(['userCode' => $newUserCode]);
            }
        }
    }
}
