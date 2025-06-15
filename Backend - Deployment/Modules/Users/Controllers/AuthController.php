<?php

namespace Modules\Users\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Modules\Users\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class AuthController extends Controller
{
    /**
     * Show the registration form.
     *
     * Usage: Typically rendered by the frontend for user signup UI.
     */
    public function showRegisterForm()
    {
        try {
            return view('auth.register');
        } catch (\Exception $e) {
            Log::error('Failed to show registration form: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to load registration form.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Show the login form.
     *
     * Usage: Typically rendered by the frontend for login UI.
     */
    public function showLoginForm()
    {
        try {
            return view('auth.login');
        } catch (\Exception $e) {
            Log::error('Failed to show login form: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to load login form.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Handle user registration.
     *
     * Validates input, checks for duplicate email/userCode, handles Dean count,
     * and creates a new user with appropriate status and role-based behavior.
     */
    public function register(Request $request)
    {
        try {
            // Log registration attempt
            Log::info('Registration attempt for user code: ' . $request->userCode);

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
                Log::warning('Registration failed: User code already exists - ' . $validated['userCode']);
                return response()->json([
                    'message' => 'User code already exists.'
                ], 409);
            }

            // Check if email already exists
            if (User::where('email', $validated['email'])->exists()) {
                Log::warning('Registration failed: Email already exists - ' . $validated['email']);
                return response()->json([
                    'message' => 'Email already exists.'
                ], 409);
            }

            // Check if userCode exists in students table
            $studentExists = DB::table('students')
                ->where('userCode', $validated['userCode'])
                ->where('lastName', strtoupper($validated['lastName']))
                ->exists();

            // Get status IDs
            $pendingStatusId = DB::table('statuses')->where('name', 'pending')->first()->id;
            $registeredStatusId = DB::table('statuses')->where('name', 'registered')->first()->id;  

            // Determine initial status and activation based on role and student verification
            $statusId = $pendingStatusId; // Default to pending
            $isActive = false; // Default to inactive

            // For students, check if credentials match students table
            if ($validated['roleID'] == 1) {
                if ($studentExists) {
                    // If credentials match, set to registered and active
                    $statusId = $registeredStatusId;
                    $isActive = true;
                } else {
                    // If credentials don't match, keep as pending and inactive
                    $statusId = $pendingStatusId;
                    $isActive = false;
                }
            } else if (!$studentExists && !in_array($validated['roleID'], [1, 2, 3, 5])) {
                // For non-student roles (except dean, associate dean, and program chair), set to registered and active
                $statusId = $registeredStatusId;
                $isActive = true;
            }

            // Limit Deans to 1 user only
            if ($validated['roleID'] == 4) {
                $deanCount = User::where('roleID', 4)->count();
                if ($deanCount >= 1) {
                    Log::warning('Registration failed: Dean limit exceeded');
                    return response()->json(['message' => 'Only 1 Dean is allowed. Registration failed.'], 403);
                }
            }

            // Limit Associate Deans to 1 per campus
            if ($validated['roleID'] == 5) {
                $associateDeanCount = User::where('roleID', 5)
                    ->where('campusID', $validated['campusID'])
                    ->count();
                if ($associateDeanCount >= 1) {
                    Log::warning('Registration failed: Associate Dean limit exceeded for campus ID ' . $validated['campusID']);
                    return response()->json(['message' => 'Only 1 Associate Dean is allowed per campus.'], 403);
                }
            }

            // Limit Program Chairs to 1 per program per campus
            if ($validated['roleID'] == 3) { // Program Chair role
                $programChairCount = User::where('roleID', 3)
                    ->where('programID', $validated['programID'])
                    ->where('campusID', $validated['campusID'])
                    ->count();
                
                if ($programChairCount >= 1) {
                    Log::warning('Registration failed: Program Chair already exists for program ID ' . $validated['programID'] . ' in campus ID ' . $validated['campusID']);
                    return response()->json([
                        'message' => 'A Program Chair already exists for this program in this campus.'
                    ], 403);
                }
            }

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

            Log::info('User registered successfully: ' . $validated['userCode']);

            // Return the newly created user
            return response()->json([
                'message' => 'User registered successfully.',
                'user' => $user
            ], 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::error('Registration validation failed: ' . json_encode($e->errors()));
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Registration failed: ' . $e->getMessage());
            return response()->json([
                'message' => 'An error occurred during registration.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Handle user login/authentication.
     *
     * Verifies credentials, checks status and active flag, and returns access token.
     */
    public function login(Request $request)
    {
        try {
            // Log login attempt
            Log::info('Login attempt for user code: ' . $request->userCode);

            // Validate userCode and password
            $credentials = $request->validate([
                'userCode' => 'required',
                'password' => 'required'
            ]);

            // Look up the user
            $user = User::where('userCode', $request->userCode)->first();

            // Return if credentials don't match
            if (!$user || !Hash::check($request->password, $user->password)) {
                Log::warning('Failed login attempt for user code: ' . $request->userCode);
                return response()->json(['message' => 'Wrong Credentials.'], 401);
            }

            // Get status IDs
            $pendingStatusId = DB::table('statuses')->where('name', 'pending')->first()->id;
            $registeredStatusId = DB::table('statuses')->where('name', 'registered')->first()->id;

            // Return if account is not registered
            if ($user->status_id === $pendingStatusId) {
                Log::warning('Login attempt for pending account: ' . $request->userCode);
                return response()->json([
                    'message' => 'Your account is pending approval. Please wait for administrator verification.',
                    'status' => 'pending',
                    'userCode' => $request->userCode
                ], 403);
            }

            // Return if account is inactive
            if (!$user->isActive) {
                Log::warning('Login attempt for inactive account: ' . $request->userCode);
                return response()->json([
                    'message' => 'Your account is inactive. Please contact an administrator to reactivate your account.',
                    'status' => 'inactive',
                    'userCode' => $request->userCode
                ], 403);
            }

            // Revoke any old tokens (force logout)
            $user->tokens()->delete();

            // Sanity check: if somehow a token still exists
            if ($user->tokens()->count() > 0) {
                Log::error('Token deletion failed for user: ' . $request->userCode);
                return response()->json(['message' => 'This user is already logged in.'], 403);
            }

            // Generate new token valid for 3 hours
            $tokenResult = $user->createToken('auth_token', ['*'], now()->addHours(3));
            $plainTextToken = $tokenResult->plainTextToken;

            Log::info('Successful login for user: ' . $request->userCode);

            // Return user data with token
            return response()->json([
                'message' => 'Login successful',
                'user' => $user,
                'token' => $plainTextToken,
                'expires_at' => now()->addHours(3)->toDateTimeString(),
            ], 200);

        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::error('Login validation failed: ' . json_encode($e->errors()));
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Login failed: ' . $e->getMessage());
            return response()->json([
                'message' => 'An error occurred during login.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Logout the currently authenticated user.
     *
     * Revokes the current access token to end the session.
     */
    public function logout(Request $request)
    {
        try {
            $user = $request->user();
            Log::info('Logout attempt for user: ' . $user->userCode);

            $request->user()->currentAccessToken()->delete();

            Log::info('Successful logout for user: ' . $user->userCode);
            return response()->json(['message' => 'Logged out successfully']);

        } catch (\Exception $e) {
            Log::error('Logout failed: ' . $e->getMessage());
            return response()->json([
                'message' => 'An error occurred during logout.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Change the password of the authenticated user.
     *
     * Validates old password, enforces new password rules, and saves the change.
     */
    public function changePassword(Request $request)
    {
        try {
            $user = $request->user();
            Log::info('Password change attempt for user: ' . $user->userCode);

            // Validate the incoming request
            $validator = Validator::make($request->all(), [
                'password' => 'required', // current password
                'new_password' => 'required|min:8|confirmed', // must match new_password_confirmation
            ]);

            // Return validation errors if any
            if ($validator->fails()) {
                Log::warning('Password change validation failed for user: ' . $user->userCode);
                return response()->json(['errors' => $validator->errors()], 422);
            }

            // Check if the current password is correct
            if (!Hash::check($request->password, $user->password)) {
                Log::warning('Incorrect current password provided for user: ' . $user->userCode);
                return response()->json([
                    'message' => 'Current password is incorrect.'
                ], 403);
            }

            // Prevent reusing the current password
            if (Hash::check($request->new_password, $user->password)) {
                Log::warning('Attempt to reuse current password for user: ' . $user->userCode);
                return response()->json([
                    'message' => 'New password must be different from the current password.'
                ], 422);
            }

            // Update the password
            $user->update([
                'password' => Hash::make($request->new_password),
            ]);

            Log::info('Password changed successfully for user: ' . $user->userCode);
            return response()->json([
                'message' => 'Password changed successfully'
            ], 200);

        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::error('Password change validation failed: ' . json_encode($e->errors()));
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Password change failed: ' . $e->getMessage());
            return response()->json([
                'message' => 'An error occurred while changing the password.',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
