<?php

namespace Modules\Users\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Modules\Users\Models\User;

class PasswordResetController extends Controller
{
    /**
     * Send a password reset link to the user's email.
     *
     * Usage: Called when a user requests to reset their password via "Forgot Password" form.
     */
    public function sendResetLinkEmail(Request $request)
    {
        $validated = $request->validate(['email' => 'required|email']);
        $email = Str::lower(trim($validated['email']));

        // Log the email address that requested the reset link
        Log::info('Attempting to send reset link to: ' . $email);

        try {
            $user = User::whereRaw('LOWER(email) = ?', [$email])->first();

            if (!$user) {
                Log::info('Password reset requested for unknown email: ' . $email);
                return response()->json([
                    'message' => 'No CAPS account was found with that email address.',
                    'status' => Password::INVALID_USER
                ], 422);
            }

            // Attempt to send the reset link to the provided email
            $status = Password::broker('users')->sendResetLink(['email' => $user->email]);

            // Log the result status of the attempt
            Log::info('Password reset link sent status: ' . $status);

            // If reset link was successfully sent
            if ($status === Password::RESET_LINK_SENT) {
                return response()->json([
                    'message' => 'Password reset link has been sent to your email.',
                    'status' => $status
                ], 200);
            }

            if ($status === Password::RESET_THROTTLED) {
                return response()->json([
                    'message' => 'A reset link was already requested recently. Please check your email or try again in a few minutes.',
                    'status' => $status
                ], 429);
            }

            // If the email was not found or another issue occurred
            return response()->json([
                'message' => 'Unable to send reset link. Please try again later.',
                'status' => $status
            ], 422); // HTTP 422 Unprocessable Entity
        } catch (\Exception $e) {
            // Log any unexpected exception
            Log::error('Error sending reset link: ' . $e->getMessage());

            // Return internal error response
            return response()->json([
                'message' => 'An error occurred while sending the reset link.'
            ], 500); // HTTP 500 Internal Server Error
        }
    }

    /**
     * Reset the user's password using the token.
     *
     * Usage: Called when the user submits the reset form with the token and new password.
     */
    public function reset(Request $request)
    {
        // Validate required input: token, email, new password, and password confirmation
        $request->validate([
            'token' => 'required',
            'email' => 'required|email',
            'password' => 'required|confirmed|min:8',
        ]);

        try {
            // Attempt to reset the password using Laravel's Password broker
            $email = Str::lower(trim($request->input('email')));
            $user = User::whereRaw('LOWER(email) = ?', [$email])->first();

            if (!$user) {
                return response()->json([
                    'message' => 'No CAPS account was found with that email address.',
                    'status' => Password::INVALID_USER
                ], 422);
            }

            $status = Password::broker('users')->reset(
                [
                    'email' => $user->email,
                    'password' => $request->input('password'),
                    'password_confirmation' => $request->input('password_confirmation'),
                    'token' => $request->input('token'),
                ],
                function ($user, $password) {
                    // Set the new password using bcrypt and save the user
                    $user->forceFill([
                        'password' => bcrypt($password)
                    ])->save();
                }
            );

            // If password was reset successfully
            if ($status === Password::PASSWORD_RESET) {
                return response()->json([
                    'message' => 'Password has been reset successfully.',
                    'status' => $status
                ], 200);
            }

            // If token is invalid or expired
            return response()->json([
                'message' => 'Password reset failed. The token may be invalid or expired.',
                'status' => $status
            ], 422);
        } catch (\Exception $e) {
            // Handle and return unexpected errors
            return response()->json([
                'message' => 'An error occurred while resetting the password.'
            ], 500); // HTTP 500 Internal Server Error
        }
    }
}
