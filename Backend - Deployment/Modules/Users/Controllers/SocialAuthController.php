<?php

namespace Modules\Users\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Laravel\Socialite\Facades\Socialite;
use Modules\Users\Models\User;

class SocialAuthController extends Controller
{
    // Starts the Google OAuth flow and remembers which frontend should receive the callback result.
    public function redirectToGoogle(Request $request)
    {
        $response = Socialite::driver('google')->stateless()->redirect();
        $frontendUrlCookie = $this->makeFrontendUrlCookie($request);

        if ($frontendUrlCookie) {
            $response->withCookie($frontendUrlCookie);
        }

        return $response;
    }

    // Handles the Google provider callback and always sends the browser back to the frontend.
    public function handleGoogleCallback()
    {
        try {
            $googleUser = Socialite::driver('google')->stateless()->user();
            return $this->handleOAuthUser($googleUser, 'google');
        } catch (\Exception $e) {
            Log::error('Google OAuth error: ' . $e->getMessage());
            return $this->redirectToFrontendError(
                'provider_failed',
                'Failed to authenticate with Google.',
                'google'
            );
        }
    }

    // Starts the Facebook OAuth flow and remembers which frontend should receive the callback result.
    public function redirectToFacebook(Request $request)
    {
        $response = Socialite::driver('facebook')->stateless()->redirect();
        $frontendUrlCookie = $this->makeFrontendUrlCookie($request);

        if ($frontendUrlCookie) {
            $response->withCookie($frontendUrlCookie);
        }

        return $response;
    }

    // Handles the Facebook provider callback and always sends the browser back to the frontend.
    public function handleFacebookCallback()
    {
        try {
            $facebookUser = Socialite::driver('facebook')->stateless()->user();
            return $this->handleOAuthUser($facebookUser, 'facebook');
        } catch (\Exception $e) {
            Log::error('Facebook OAuth error: ' . $e->getMessage());
            return $this->redirectToFrontendError(
                'provider_failed',
                'Failed to authenticate with Facebook.',
                'facebook'
            );
        }
    }

    // Reuses an existing CAPS account by provider ID first, then links by email when safe.
    private function handleOAuthUser($oauthUser, $provider)
    {
        $providerId = $provider . '_id';
        $user = User::where($providerId, $oauthUser->getId())->first();

        if (!$user && $oauthUser->getEmail()) {
            $existingUser = User::where('email', $oauthUser->getEmail())->first();

            if ($existingUser) {
                if ($existingUser->$providerId && $existingUser->$providerId !== $oauthUser->getId()) {
                    return $this->redirectToFrontendError(
                        'account_mismatch',
                        ucfirst($provider) . ' is already linked to a different account.',
                        $provider
                    );
                }

                $existingUser->$providerId = $oauthUser->getId();
                $existingUser->save();
                $user = $existingUser;
            }
        }

        if (!$user) {
            return $this->redirectToFrontendError(
                'no_account',
                'No existing CAPS account matches this ' . ucfirst($provider) . ' account. Log in with your CAPS account first.',
                $provider
            );
        }

        return $this->redirectToFrontendSuccess($user, $provider);
    }

    // Creates a Sanctum token and returns the user to the frontend callback route with success params.
    private function redirectToFrontendSuccess(User $user, string $provider)
    {
        Auth::login($user);
        $token = $user->createToken('auth-token')->plainTextToken;

        return redirect()->away($this->buildFrontendUrl("/auth/{$provider}/callback", [
            'social_token' => $token,
            'provider' => $provider,
        ]))->withoutCookie('oauth_frontend_url');
    }

    // Returns the user to the frontend with a provider-specific error code and message.
    private function redirectToFrontendError(string $code, string $message, string $provider)
    {
        return redirect()->away($this->buildFrontendUrl("/auth/{$provider}/callback", [
            'social_error' => $code,
            'message' => $message,
            'provider' => $provider,
        ]))->withoutCookie('oauth_frontend_url');
    }

    // Builds a frontend URL from the resolved base URL, callback path, and query parameters.
    private function buildFrontendUrl(string $path = '/', array $params = []): string
    {
        $baseUrl = rtrim($this->resolveFrontendBaseUrl(), '/');
        $normalizedPath = '/' . ltrim($path, '/');
        $query = http_build_query($params);

        return $query
            ? "{$baseUrl}{$normalizedPath}?{$query}"
            : "{$baseUrl}{$normalizedPath}";
    }

    // Chooses the safest frontend base URL from the OAuth cookie, config, or a local fallback guess.
    private function resolveFrontendBaseUrl(): string
    {
        $cookieFrontendUrl = request()->cookie('oauth_frontend_url');

        if ($this->isAllowedFrontendUrl($cookieFrontendUrl)) {
            return $cookieFrontendUrl;
        }

        $configuredFrontendUrl = config('app.frontend_url');

        if ($this->isAllowedFrontendUrl($configuredFrontendUrl)) {
            return $configuredFrontendUrl;
        }

        return $this->guessFrontendUrl();
    }

    // Stores an approved frontend URL in a short-lived cookie so the provider callback can reuse it.
    private function makeFrontendUrlCookie(Request $request)
    {
        $frontendUrl = $request->query('frontend_url');

        if (!$this->isAllowedFrontendUrl($frontendUrl)) {
            return null;
        }

        return cookie(
            'oauth_frontend_url',
            $frontendUrl,
            10,
            '/',
            null,
            false,
            false,
            false,
            'Lax'
        );
    }

    // Limits frontend redirects to known hosts so OAuth callbacks cannot be turned into open redirects.
    private function isAllowedFrontendUrl(?string $frontendUrl): bool
    {
        if (!$frontendUrl || !filter_var($frontendUrl, FILTER_VALIDATE_URL)) {
            return false;
        }

        $scheme = parse_url($frontendUrl, PHP_URL_SCHEME);
        $host = parse_url($frontendUrl, PHP_URL_HOST);
        $configuredHost = parse_url(config('app.frontend_url'), PHP_URL_HOST);
        $requestHost = request()->getHost();

        if (!in_array($scheme, ['http', 'https'], true)) {
            return false;
        }

        return in_array($host, array_filter([
            $requestHost,
            $configuredHost,
            'localhost',
            '127.0.0.1',
        ]), true);
    }

    // Provides a final localhost-style fallback when no trusted frontend URL was supplied.
    private function guessFrontendUrl(): string
    {
        $request = request();
        $scheme = $request->getScheme() ?: parse_url(config('app.url'), PHP_URL_SCHEME) ?: 'http';
        $host = $request->getHost() ?: parse_url(config('app.url'), PHP_URL_HOST) ?: 'localhost';

        return "{$scheme}://{$host}:8085";
    }

    // Links an OAuth provider to an already authenticated CAPS account after token verification.
    public function verifyLink(Request $request)
    {
        $request->validate([
            'email' => 'required|email|exists:users,email',
            'provider' => 'required|in:google,facebook',
            'oauth_token' => 'required|string'
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json(['message' => 'User not found'], 404);
        }

        $provider = $request->provider;
        $providerId = $provider . '_id';

        if ($user->$providerId) {
            return response()->json(['message' => 'Account already linked'], 400);
        }

        try {
            $oauthUser = Socialite::driver($provider)->userFromToken($request->oauth_token);
            
            $user->$providerId = $oauthUser->getId();
            $user->save();

            Auth::login($user);
            $token = $user->createToken('auth-token')->plainTextToken;

            return response()->json([
                'message' => 'Account linked successfully',
                'user' => $user,
                'token' => $token
            ], 200);
        } catch (\Exception $e) {
            Log::error('Link verification error: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to verify OAuth token'], 500);
        }
    }
}
