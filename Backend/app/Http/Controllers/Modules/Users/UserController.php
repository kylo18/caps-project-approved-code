<?php

namespace app\Http\Controllers\Modules\Users;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use App\Models\Modules\Users\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

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

            if ($user->roleID != 4) {
                return response()->json(['message' => 'Forbidden'], 403);
            }

            // Fetch all users with role, campus, and program information
            $users = User::with(['role', 'campus', 'program']) // Eager load program relationship
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
                                'status' => $user->status,
                            ];
                        });

            return response()->json(['users' => $users], 200);
        } catch (\Exception $e) {
            Log::error("Error fetching users: " . $e->getMessage());
            return response()->json(['message' => 'An error occurred while fetching users. Please try again later.'], 500);
        }
    }


    /**
     * Show a single user by ID (Only Admins or the user themselves).
     */
    public function show($id)
    {
        $authUser = Auth::user();
        if ($authUser->roleID < 3 && $authUser->userID != $id) {
            return response()->json(['message' => 'Unauthorized: You can only view your own profile'], 403);
        }

        $user = User::findOrFail($id);
        return response()->json($user, 200);
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

    public function approveUser(Request $request, $userID)
    {
        // Get the authenticated user (Dean)
        $authUser = Auth::user();

        // Check if the logged-in user is a Dean
        if ($authUser->roleID !== 4) {
            return response()->json(['message' => 'Unauthorized. Only the Dean can approve users.'], 403);
        }

        // Find the user
        $user = User::find($userID);

        if (!$user) {
            return response()->json(['message' => 'User not found.'], 404);
        }

        // If the user is unregistered, delete them
        if ($user->status === 'unregistered') {
            $user->delete();
            return response()->json(['message' => 'User was unregistered and has been deleted.'], 200);
        }

        // Only pending users can be approved
        if ($user->status !== 'pending') {
            return response()->json(['message' => 'User is already registered.'], 400);
        }

        // Update user status to registered and activate the user
        $user->update([
            'status' => 'registered',
            'isActive' => true
        ]);

        return response()->json(['message' => 'User approved successfully.', 'user' => $user], 200);
    }

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

        // If already unregistered, prevent unnecessary updates
        if ($user->status === 'unregistered') {
            return response()->json(['message' => 'User is already unregistered.'], 400);
        }

        // Mark user as unregistered instead of deleting immediately
        $user->update(['status' => 'unregistered']);

        return response()->json(['message' => 'User has been marked as unregistered.', 'user' => $user], 200);
    }
}
