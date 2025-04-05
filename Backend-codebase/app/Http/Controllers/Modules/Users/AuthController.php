<?php

namespace App\Http\Controllers\Modules\Users;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use App\Models\Modules\Users\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Show the register form.
     */
    public function showRegisterForm()
    {
        return view('auth.register');
    }

    /**
     * Show the login form.
     */
    public function showLoginForm()
    {
        return view('auth.login');
    }

    /**
     * Register a new user.
     */
    public function register(Request $request)
    {
        // Validate required fields
        $validated = $request->validate([
            'userCode' => 'required|string|max:10',
            'firstName' => 'required|string|max:50',
            'lastName' => 'required|string|max:50',
            'email' => 'required|string|email|max:100',
            'password' => 'required|string|min:8',
            'roleID' => 'required|exists:roles,roleID',
            'campusID' => 'required|exists:campuses,campusID',
            'programID' => 'required|exists:programs,programID',
        ]);

        // Check if userCode exists
        if (User::where('userCode', $validated['userCode'])->exists()) {
            return response()->json([
                'message' => 'User code already exists.'
            ], 409); // Conflict status
        }

        // Check if email exists
        if (User::where('email', $validated['email'])->exists()) {
            return response()->json([
                'message' => 'Email already exists.'
            ], 409); // Conflict status
        }

        // 🔹 Check if the role is Dean (roleID = 4) and limit to 2 Deans
        if ($validated['roleID'] == 4) {
            $deanCount = User::where('roleID', 4)->count();
            if ($deanCount >= 2) {
                return response()->json(['message' => 'Only 2 Deans are allowed. Registration failed.'], 403);
            }
        }

        // Determine user status based on role
        $status = in_array($validated['roleID'], [2, 3]) ? 'pending' : 'registered';

        // Create the user with validated data
        $user = User::create([
            'userCode' => $validated['userCode'],
            'firstName' => $validated['firstName'],
            'lastName' => $validated['lastName'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'roleID' => $validated['roleID'],
            'campusID' => $validated['campusID'],
            'programID' => $validated['programID'],
            'isActive' => false,
            'status' => $status,
        ]);

        // Return success response with created user details
        return response()->json([
            'message' => 'User registered successfully.',
            'user' => $user
        ], 201); // 201 Created status
    }

    public function login(Request $request)
    {
        $credentials = $request->validate([
            'userCode' => 'required',
            'password' => 'required'
        ]);

        $user = User::where('userCode', $request->userCode)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Wrong Credentials.'], 401);
        }

        if (!$user->isActive) {
            return response()->json(['message' => 'Your account is inactive. Contact an administrator.'], 403);
        }

        if (in_array($user->status, ['pending', 'unregistered'])) {
            return response()->json(['message' => 'Your account is not registered yet. Please wait for administrator approval.'], 403);
        }

        if ($user->tokens()->count() > 0) {
            return response()->json(['message' => 'This user is already logged in.'], 403);
        }

        $user->tokens()->delete();

        $tokenResult = $user->createToken('auth_token', ['*'], now()->addHours(3));
        $plainTextToken = $tokenResult->plainTextToken;

        return response()->json([
            'message' => 'Login successful',
            'user' => $user,
            'token' => $plainTextToken,
            'expires_at' => now()->addHours(3)->toDateTimeString(),
        ], 200);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out successfully']);
    }

    public function changePassword(Request $request)
    {
        $request->validate([
            'password' => 'required',
            'new_password' => 'required|min:8|confirmed',
        ]);

        $user = $request->user();

        if (!Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'password' => ['Current password is incorrect.'],
            ]);
        }

        $user->update([
            'password' => Hash::make($request->new_password),
        ]);

        return response()->json([
            'message' => 'Password changed successfully'
        ], 200);
    }
}
