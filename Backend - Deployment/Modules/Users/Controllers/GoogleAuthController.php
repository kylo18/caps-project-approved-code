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
        $frontendUrl = env('FRONTEND_URL', 'http://localhost:5173');

        try {
            $googleUser = Socialite::driver('google')->stateless()
                ->setHttpClient(new \GuzzleHttp\Client(['verify' => false]))
                ->user();

            $user = User::where('google_id', $googleUser->id)
                ->orWhere('email', $googleUser->email)
                ->first();

            // ── NOT REGISTERED ───────────────────────────────────
            if (!$user) {
                return redirect($frontendUrl . '/google-auth-callback?error=' . urlencode('Your Gmail is not registered in CAPS. Please register first.'));
            }

            // Update google_id if missing
            if (!$user->google_id) {
                $user->update(['google_id' => $googleUser->id]);
            }

            // ── APPROVED ─────────────────────────────────────────
            if ($user->status_id == 2) {
                $token = $user->createToken('auth_token')->plainTextToken;
                $userData = urlencode(json_encode($user));

                return redirect($frontendUrl . '/google-auth-callback?token=' . $token . '&user=' . $userData);
            }

            // ── PENDING or DISAPPROVED ───────────────────────────
            $message = ($user->status_id == 3)
                ? 'Your account has been disapproved.'
                : 'Your account is still pending admin approval.';

            return redirect($frontendUrl . '/google-auth-callback?error=' . urlencode($message));

        } catch (Exception $e) {
            return redirect($frontendUrl . '/google-auth-callback?error=' . urlencode('Google Authentication Failed. Please try again.'));
        }
    }
}