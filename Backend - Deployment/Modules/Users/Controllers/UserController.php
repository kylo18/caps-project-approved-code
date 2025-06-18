<?php

namespace Modules\Users\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Modules\Users\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    /**
     * Get all active users (Only Admins can access this).
     */
    public function index(Request $request)
    {
        try {
            $this->authorizeUserAccess();
            
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

        return response()->json([
            'email' => $user->email,
            'fullName' => $user->firstName . ' ' . $user->lastName,
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
     * Approve single user (Only Dean can do this).
     */
    public function approveUser(Request $request, $userID)
    {
        $this->authorizeDeanAccess();
        $user = User::findOrFail($userID);

        if (!$this->isUserPending($user)) {
            return response()->json(['message' => 'User is already registered.'], 400);
        }

        $this->updateUserStatus($user, 'registered', true);
        return response()->json(['message' => 'User approved successfully.', 'user' => $user], 200);
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
            $this->validateRoleChangePermission($authUser);

            $validated = $request->validate(['roleID' => 'required|integer|exists:roles,roleID']);
            $user = User::findOrFail($userID);

            $this->validateRoleChangeScope($authUser, $user, $validated['roleID']);
            $this->updateUserRole($user, $validated['roleID']);

            return response()->json([
                'message' => 'User role updated successfully.',
                'user' => $user
            ], 200);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => 'Validation failed.', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            Log::error('Role change error: ' . $e->getMessage());
            return response()->json([
                'message' => 'An unexpected error occurred while changing the user role.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // Private helper methods

    private function authorizeUserAccess()
    {
        $user = Auth::user();
        if (!$user || !in_array($user->roleID, [4, 5])) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }
    }

    private function authorizeDeanAccess()
    {
        $authUser = Auth::user();
        if (!in_array($authUser->roleID, [4, 5])) {
            return response()->json(['message' => 'Unauthorized: Only the Dean or Associate Dean can perform this action'], 403);
        }
    }

    private function buildUserQuery(Request $request)
    {
        $query = User::with(['role', 'campus', 'program', 'status']);
        $user = Auth::user();

        if ($user->roleID === 5) {
            $query->where('campusID', $user->campusID);
        }

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

    private function validateRoleChangePermission($authUser)
    {
        if (!in_array($authUser->roleID, [3, 4, 5])) {
            throw new \Exception('Unauthorized. Only Dean, Associate Dean, or Program Chair can change user roles.');
        }
    }

    private function validateRoleChangeScope($authUser, $user, $newRoleID)
    {
        $allowedRoleChanges = $this->getAllowedRoleChanges($authUser->roleID);
        
        if (!in_array($newRoleID, $allowedRoleChanges)) {
            throw new \Exception('You are not authorized to assign this role.');
        }

        if ($authUser->roleID !== 4) {
            if ($user->roleID <= $authUser->roleID) {
                throw new \Exception('You cannot change the role of users with higher or equal role level.');
            }

            if ($authUser->roleID === 5 && $user->campusID !== $authUser->campusID) {
                throw new \Exception('You can only change roles of users within your campus.');
            }

            if ($authUser->roleID === 3 && $user->programID !== $authUser->programID) {
                throw new \Exception('You can only change roles of users within your program.');
            }
        }
    }

    private function getAllowedRoleChanges($roleID)
    {
        return match($roleID) {
            4 => [1, 2, 3, 4, 5], // Dean
            5 => [1, 2, 3],      // Associate Dean
            3 => [1, 2],         // Program Chair
            default => []
        };
    }

    private function updateUserRole($user, $newRoleID)
    {
        $user->roleID = $newRoleID;
        $user->save();
    }
}
