<?php

namespace Modules\Users\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Log;

class PasswordResetController extends Controller
{
    public function sendResetLinkEmail(Request $request)
    {
        $request->validate(['email' => 'required|email']);

        Log::info('Attempting to send reset link to: ' . $request->email); // Log the email attempt

        try {
            $status = Password::sendResetLink($request->only('email'));
            Log::info('Password reset link sent status: ' . $status); // Log status

            if ($status === Password::RESET_LINK_SENT) {
                return response()->json([
                    'message' => 'Password reset link has been sent to your email.',
                    'status' => $status
                ], 200);
            }
            return response()->json([
                'message' => 'Unable to send reset link. Please check if the email is registered.',
                'status' => $status
            ], 422);
        } catch (\Exception $e) {
            Log::error('Error sending reset link: ' . $e->getMessage()); // Log any errors
            return response()->json([
                'message' => 'An error occurred while sending the reset link.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function reset(Request $request)
    {
        $request->validate([
            'token' => 'required',
            'email' => 'required|email',
            'password' => 'required|confirmed|min:8',
        ]);

        try {
            $status = Password::reset(
                $request->only('email', 'password', 'password_confirmation', 'token'),
                function ($user, $password) {
                    $user->forceFill([
                        'password' => bcrypt($password)
                    ])->save();
                }
            );

            if ($status === Password::PASSWORD_RESET) {
                return response()->json([
                    'message' => 'Password has been reset successfully.',
                    'status' => $status
                ], 200);
            }

            return response()->json([
                'message' => 'Password reset failed. The token may be invalid or expired.',
                'status' => $status
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'An error occurred while resetting the password.',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
