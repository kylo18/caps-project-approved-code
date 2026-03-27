<?php

namespace Modules\Users\Controllers;

use Illuminate\Routing\Controller;
use Laravel\Socialite\Facades\Socialite;
use Modules\Users\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Exception;

class GoogleAuthController extends Controller
{
    /**
     * Redirect the user to the Google authentication page.
     */
    public function redirectToGoogle()
    {
        return Socialite::driver('google')->stateless()->redirect();
    }

    /**
     * Obtain the user information from Google.
     */
    public function handleGoogleCallback()
    {
        try {
            $googleUser = Socialite::driver('google')->stateless()
                ->setHttpClient(new \GuzzleHttp\Client(['verify' => false]))
                ->user();
            
            // Check if user already exists
            $user = User::where('google_id', $googleUser->id)
                        ->orWhere('email', $googleUser->email)
                        ->first();

            if (!$user) {
                // DO NOT CREATE USER automatically (User requirement)
                return response()->json([
                    'message' => 'gmail not register',
                    'error_code' => 404
                ], 404);
            }

            // Update google_id if it's missing (e.g., existing user logging in via Google for the first time)
            if (!$user->google_id) {
                $user->update(['google_id' => $googleUser->id]);
            }
            
            // ALLOW login if the user is APPROVED (status_id = 2) or REGISTERED (status_id = 4)
            if ($user->status_id == 2 || $user->status_id == 4) {
                $token = $user->createToken('auth_token')->plainTextToken;

                return response()->json([
                    'message' => 'Login successful',
                    'access_token' => $token,
                    'token_type' => 'Bearer',
                    'user' => $user
                ], 200);
            }

            // If not approved, return appropriate message
            $message = ($user->status_id == 3) 
                ? 'Your account has been disapproved.' 
                : 'Your account is still pending admin approval.';
            
            return response()->json([
                'message' => $message,
                'status' => 'waiting_approval'
            ], 403);
        } catch (Exception $e) {
            return response()->json(['error' => 'Google Authentication Failed: ' . $e->getMessage()], 500);
        }
    }
}
