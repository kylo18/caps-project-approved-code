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
            $user = Auth::user();

            if (!$user) {
                return response()->json(['message' => 'Unauthorized'], 401);
            }

            // Only Dean (roleID = 4) can access the user list
            if ($user->roleID != 4) {
                return response()->json(['message' => 'Forbidden'], 403);
            }

            // Eager load related role, campus, program, and status data for each user
            $users = User::with(['role', 'campus', 'program', 'status'])
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

            return response()->json(['users' => $users], 200);
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

        // Only Admins can update any user, but users can update their own profile
        if ($authUser->roleID < 3 && $authUser->userID != $id) {
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
     * Deactivate user instead of deleting (Only Dean can do this).
     */
    public function deactivate($id)
    {
        $authUser = Auth::user();
        if ($authUser->roleID !== 4) {
            return response()->json(['message' => 'Unauthorized: Only the Dean can deactivate users'], 403);
        }

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
        $authUser = Auth::user();
        if ($authUser->roleID !== 4) {
            return response()->json(['message' => 'Unauthorized: Only the Dean can reactivate users'], 403);
        }

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
        $authUser = Auth::user();
        if ($authUser->roleID !== 4) {
            return response()->json(['message' => 'Unauthorized: Only the Dean can activate users'], 403);
        }

        // Validate incoming array of user IDs
        $validated = $request->validate([
            'userIDs' => 'required|array',
            'userIDs.*' => 'integer|exists:users,userID'
        ]);

        $activatedUsers = [];

        foreach ($validated['userIDs'] as $userID) {
            $user = User::find($userID);
            if ($user && !$user->isActive) {
                $user->isActive = true;
                $user->save();
                $activatedUsers[] = $userID;
            }
        }

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
        $authUser = Auth::user();
        if ($authUser->roleID !== 4) {
            return response()->json(['message' => 'Unauthorized: Only the Dean can deactivate users'], 403);
        }

        $validated = $request->validate([
            'userIDs' => 'required|array',
            'userIDs.*' => 'integer|exists:users,userID'
        ]);

        $deactivatedUsers = [];

        foreach ($validated['userIDs'] as $userID) {
            $user = User::find($userID);
            if ($user && $user->isActive) {
                $user->isActive = false;
                $user->save();
                $deactivatedUsers[] = $userID;
            }
        }

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
        $authUser = Auth::user();

        if ($authUser->roleID !== 4) {
            return response()->json(['message' => 'Unauthorized. Only the Dean can approve users.'], 403);
        }

        $user = User::find($userID);

        if (!$user) {
            return response()->json(['message' => 'User not found.'], 404);
        }

        // Get status IDs
        $pendingStatusId = DB::table('statuses')->where('name', 'pending')->first()->id;
        $registeredStatusId = DB::table('statuses')->where('name', 'registered')->first()->id;

        if ($user->status_id !== $pendingStatusId) {
            return response()->json(['message' => 'User is already registered.'], 400);
        }

        $user->update([
            'status_id' => $registeredStatusId,
            'isActive' => true
        ]);

        return response()->json(['message' => 'User approved successfully.', 'user' => $user], 200);
    }

    /**
     * Disapprove user (Only Dean).
     */
    public function disapproveUser(Request $request, $userID)
    {
        $authUser = Auth::user();

        if ($authUser->roleID !== 4) {
            return response()->json(['message' => 'Unauthorized. Only the Dean can disapprove users.'], 403);
        }

        $user = User::find($userID);

        if (!$user) {
            return response()->json(['message' => 'User not found.'], 404);
        }

        // Get disapproved status ID
        $disapprovedStatusId = DB::table('statuses')->where('name', 'disapproved')->first()->id;

        $user->update([
            'status_id' => $disapprovedStatusId,
            'isActive' => false
        ]);

        return response()->json(['message' => 'User has been disapproved.', 'user' => $user], 200);
    }

    /**
     * Approve multiple users at once (Only Dean).
     */
    public function approveMultipleUsers(Request $request)
    {
        $authUser = Auth::user();

        if ($authUser->roleID !== 4) {
            return response()->json(['message' => 'Unauthorized. Only the Dean can approve users.'], 403);
        }

        $validated = $request->validate([
            'userIDs' => 'required|array',
            'userIDs.*' => 'integer|exists:users,userID'
        ]);

        // Get status IDs
        $pendingStatusId = DB::table('statuses')->where('name', 'pending')->first()->id;
        $registeredStatusId = DB::table('statuses')->where('name', 'registered')->first()->id;
        $disapprovedStatusId = DB::table('statuses')->where('name', 'disapproved')->first()->id;

        $approvedUsers = [];
        $skippedUsers = [];

        foreach ($validated['userIDs'] as $userID) {
            $user = User::find($userID);

            if (!$user) {
                $skippedUsers[] = $userID;
                continue;
            }

            if ($user->status_id === $disapprovedStatusId) {
                $skippedUsers[] = $userID;
                continue;
            }

            if ($user->status_id !== $pendingStatusId) {
                $skippedUsers[] = $userID;
                continue;
            }

            $user->update([
                'status_id' => $registeredStatusId,
                'isActive' => true
            ]);

            $approvedUsers[] = $user;
        }

        return response()->json([
            'message' => 'Bulk approval completed.',
            'approved_users' => $approvedUsers,
            'skipped_users' => $skippedUsers
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

            $validated = $request->validate([
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

            foreach ($validated as $field => $value) {
                $user->$field = $value;
            }

            // Handle non-eloquent instances
            if (!$user instanceof User) {
                $eloquentUser = User::find($user->userID);
                if (!$eloquentUser) {
                    return response()->json(['message' => 'User record not found.'], 404);
                }

                foreach ($validated as $field => $value) {
                    $eloquentUser->$field = $value;
                }

                $eloquentUser->save();
                $user = $eloquentUser;
            } else {
                $user->save();
            }

            return response()->json([
                'message' => 'Profile updated successfully.',
                'user' => $user
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
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
        } catch (\Exception $e) {
            Log::error('Profile update error: ' . $e->getMessage());

            return response()->json([
                'message' => 'An unexpected error occurred while updating your profile.',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
