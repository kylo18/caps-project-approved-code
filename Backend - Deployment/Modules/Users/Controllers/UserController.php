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
     * Get authenticated user profile.
     */
    public function getProfile()
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
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
                'message' => 'An error occurred while approving the user.',
                'error' => $e->getMessage()
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
     * Update the authenticated user's profile.
     */
    public function updateProfile(Request $request)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return response()->json(['message' => 'User not authenticated.'], 401);
            }

            $validated = $this->validateProfileUpdate($request, $user);
            $this->updateUserProfile($user, $validated);

            return response()->json([
                'message' => 'Profile updated successfully.',
                'user' => $user
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->handleValidationError($e);
        } catch (\Exception $e) {
            Log::error('Profile update error: ' . $e->getMessage());
            return response()->json([
                'message' => 'An unexpected error occurred while updating your profile.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Change user role with specific permissions.
     */
    public function changeUserRole(Request $request, $userID)
    {
        try {
            $authUser = Auth::user();
            if (!$authUser) {
                return response()->json(['message' => 'Unauthenticated'], 401);
            }

            // Validate role change permission
            if (!in_array($authUser->roleID, [3, 4, 5])) {
                return response()->json([
                    'message' => 'Unauthorized: Only Dean, Associate Dean, or Program Chair can change user roles'
                ], 403);
            }

            // Validate request data
            $validated = $request->validate([
                'roleID' => 'required|integer|exists:roles,roleID'
            ]);

            // Get target user
            $user = User::findOrFail($userID);

            // Role hierarchy restrictions
            if ($authUser->roleID === 3) { // Program Chair
                // Program Chair cannot edit Associate Dean (5) or Dean (4)
                if ($user->roleID >= 4) {
                    return response()->json([
                        'message' => 'Program Chair cannot modify roles of Associate Dean or Dean'
                    ], 403);
                }
                // Can only edit users in their program
                if ($user->programID !== $authUser->programID) {
                    return response()->json([
                        'message' => 'You can only change roles of users within your program'
                    ], 403);
                }
            } elseif ($authUser->roleID === 5) { // Associate Dean
                // Associate Dean cannot edit Dean (4)
                if ($user->roleID === 4) {
                    return response()->json([
                        'message' => 'Associate Dean cannot modify Dean\'s role'
                    ], 403);
                }
                // Can only edit users in their campus
                if ($user->campusID !== $authUser->campusID) {
                    return response()->json([
                        'message' => 'You can only change roles of users within your campus'
                    ], 403);
                }
            }
            // Dean (roleID 4) can edit everyone, no restrictions needed

            // Validate role change scope
            $allowedRoleChanges = $this->getAllowedRoleChanges($authUser->roleID);
            if (!in_array($validated['roleID'], $allowedRoleChanges)) {
                return response()->json([
                    'message' => 'You are not authorized to assign this role'
                ], 403);
            }

            // Update the role
            $user->roleID = $validated['roleID'];
            $user->save();

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
                'message' => 'An unexpected error occurred while changing the user role',
                'error' => $e->getMessage()
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
                $q->whereHas('role', function ($q) use ($value) {
                    $q->where('roleName', $value);
                });
            },
            'position' => function ($q, $value) {
                $q->whereHas('role', function ($q) use ($value) {
                    $q->where('roleName', $value);
                });
            },
            'program' => function ($q, $value) {
                $q->whereHas('program', function ($q) use ($value) {
                    $q->where('programName', $value);
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

        $users = $query->orderBy('userID', 'desc')
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
                ];
            });

        return [
            'users' => $users,
            'total' => $total,
            'page' => (int) $page,
            'totalPages' => ceil($total / $perPage)
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
        return $request->validate([
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
        ]);
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
        if (isset($e->errors()['email'])) {
            $customErrors['email'] = ['The email is already in use by another account.'];
        }
        if (isset($e->errors()['userCode'])) {
            $customErrors['userCode'] = ['The user code is already taken.'];
        }
        return response()->json([
            'message' => 'Validation failed.',
            'errors' => count($customErrors) ? $customErrors : $e->errors()
        ], 422);
    }

    private function getAllowedRoleChanges($roleID)
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
