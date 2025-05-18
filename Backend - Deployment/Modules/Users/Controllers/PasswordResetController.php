<?php

namespace Modules\Users\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Log;

class PasswordResetController extends Controller
{
    /**
     * Send a password reset link to the user's email.
     *
     * Usage: Called when a user requests to reset their password via "Forgot Password" form.
     */
    public function sendResetLinkEmail(Request $request)
    {
        // Validate that the request has a valid email
        $request->validate(['email' => 'required|email']);

        // Log the email address that requested the reset link
        Log::info('Attempting to send reset link to: ' . $request->email);

        try {
            // Attempt to send the reset link to the provided email
            $status = Password::sendResetLink($request->only('email'));

            // Log the result status of the attempt
            Log::info('Password reset link sent status: ' . $status);

            // If reset link was successfully sent
            if ($status === Password::RESET_LINK_SENT) {
                return response()->json([
                    'message' => 'Password reset link has been sent to your email.',
                    'status' => $status
                ], 200);
            }

            // If the email was not found or another issue occurred
            return response()->json([
                'message' => 'Unable to send reset link. Please check if the email is registered.',
                'status' => $status
            ], 422); // HTTP 422 Unprocessable Entity
        } catch (\Exception $e) {
            // Log any unexpected exception
            Log::error('Error sending reset link: ' . $e->getMessage());

            // Return internal error response
            return response()->json([
                'message' => 'An error occurred while sending the reset link.',
                'error' => $e->getMessage()
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
            $status = Password::reset(
                $request->only('email', 'password', 'password_confirmation', 'token'),
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
                'message' => 'An error occurred while resetting the password.',
                'error' => $e->getMessage()
            ], 500); // HTTP 500 Internal Server Error
        }
    }
}
