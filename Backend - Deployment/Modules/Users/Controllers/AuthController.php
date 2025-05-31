<?php

namespace Modules\Users\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Modules\Users\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class AuthController extends Controller
{
    /**
     * Show the registration form.
     *
     * Usage: Typically rendered by the frontend for user signup UI.
     */
    public function showRegisterForm()
    {
        return view('auth.register');
    }

    /**
     * Show the login form.
     *
     * Usage: Typically rendered by the frontend for login UI.
     */
    public function showLoginForm()
    {
        return view('auth.login');
    }

    /**
     * Handle user registration.
     *
     * Validates input, checks for duplicate email/userCode, handles Dean count,
     * and creates a new user with appropriate status and role-based behavior.
     */
    public function register(Request $request)
    {
        // Validate required fields
        $validated = $request->validate([
            'userCode' => 'required|string|max:20',
            'firstName' => 'required|string|max:50',
            'lastName' => 'required|string|max:50',
            'email' => 'required|string|max:100',
            'password' => 'required|string|min:8',
            'roleID' => 'required|exists:roles,roleID',
            'campusID' => 'required|exists:campuses,campusID',
            'programID' => 'required|exists:programs,programID',
        ]);

        // Check if userCode already exists
        if (User::where('userCode', $validated['userCode'])->exists()) {
            return response()->json([
                'message' => 'User code already exists.'
            ], 409); // HTTP 409 Conflict
        }

        // Check if email already exists
        if (User::where('email', $validated['email'])->exists()) {
            return response()->json([
                'message' => 'Email already exists.'
            ], 409); // HTTP 409 Conflict
        }

        // Limit Deans to 2 users only
        if ($validated['roleID'] == 4) {
            $deanCount = User::where('roleID', 4)->count();
            if ($deanCount >= 2) {
                return response()->json(['message' => 'Only 2 Deans are allowed. Registration failed.'], 403);
            }
        }

        // Get status IDs
        $pendingStatusId = DB::table('statuses')->where('name', 'pending')->first()->id;
        $registeredStatusId = DB::table('statuses')->where('name', 'registered')->first()->id;

        // Determine initial status and activation based on role
        $statusId = in_array($validated['roleID'], [1, 2, 3]) ? $pendingStatusId : $registeredStatusId;
        $isActive = $validated['roleID'] == 4 ? true : false;

        // Create the user in the database
        $user = User::create([
            'userCode' => $validated['userCode'],
            'firstName' => $validated['firstName'],
            'lastName' => $validated['lastName'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'roleID' => $validated['roleID'],
            'campusID' => $validated['campusID'],
            'programID' => $validated['programID'],
            'isActive' => $isActive,
            'status_id' => $statusId,
        ]);

        // Return the newly created user
        return response()->json([
            'message' => 'User registered successfully.',
            'user' => $user
        ], 201); // HTTP 201 Created
    }

    /**
     * Handle user login/authentication.
     *
     * Verifies credentials, checks status and active flag, and returns access token.
     */
    public function login(Request $request)
    {
        // Validate userCode and password
        $credentials = $request->validate([
            'userCode' => 'required',
            'password' => 'required'
        ]);

        // Look up the user
        $user = User::where('userCode', $request->userCode)->first();

        // Return if credentials don't match
        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Wrong Credentials.'], 401);
        }

        // Return if account is inactive
        if (!$user->isActive) {
            return response()->json(['message' => 'Your account is inactive. Contact an administrator.'], 403);
        }

        // Get status IDs
        $pendingStatusId = DB::table('statuses')->where('name', 'pending')->first()->id;
        $registeredStatusId = DB::table('statuses')->where('name', 'registered')->first()->id;

        // Return if account is not registered
        if ($user->status_id === $pendingStatusId) {
            return response()->json(['message' => 'Your account is not registered yet. Please wait for administrator approval.'], 403);
        }

        // Revoke any old tokens (force logout)
        $user->tokens()->delete();

        // Sanity check: if somehow a token still exists
        if ($user->tokens()->count() > 0) {
            return response()->json(['message' => 'This user is already logged in.'], 403);
        }

        // Generate new token valid for 3 hours
        $tokenResult = $user->createToken('auth_token', ['*'], now()->addHours(3));
        $plainTextToken = $tokenResult->plainTextToken;

        // Return user data with token
        return response()->json([
            'message' => 'Login successful',
            'user' => $user,
            'token' => $plainTextToken,
            'expires_at' => now()->addHours(3)->toDateTimeString(),
        ], 200);
    }

    /**
     * Logout the currently authenticated user.
     *
     * Revokes the current access token to end the session.
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out successfully']);
    }

    /**
     * Change the password of the authenticated user.
     *
     * Validates old password, enforces new password rules, and saves the change.
     */
    public function changePassword(Request $request)
    {
        // Validate the incoming request
        $validator = Validator::make($request->all(), [
            'password' => 'required', // current password
            'new_password' => 'required|min:8|confirmed', // must match new_password_confirmation
        ]);

        // Return validation errors if any
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = $request->user();

        // Check if the current password is correct
        if (!Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'Current password is incorrect.'
            ], 403);
        }

        // Prevent reusing the current password
        if (Hash::check($request->new_password, $user->password)) {
            return response()->json([
                'message' => 'New password must be different from the current password.'
            ], 422);
        }

        // Update the password
        $user->update([
            'password' => Hash::make($request->new_password),
        ]);

        return response()->json([
            'message' => 'Password changed successfully'
        ], 200);
    }
}
