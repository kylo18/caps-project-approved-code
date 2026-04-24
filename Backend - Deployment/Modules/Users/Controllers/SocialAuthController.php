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
        try {
            if (!config('services.google.client_id')) {
                throw new \Exception('Google Client ID is missing. Check your .env file and configuration cache.');
            }

            Log::info('Google OAuth redirect initiated', [
                'frontend_url' => $request->query('frontend_url'),
                'ip' => $request->ip(),
            ]);

            $redirectUrl = config('services.google.redirect');
            $driver = Socialite::driver('google')->stateless();

            if ($redirectUrl) {
                $driver->redirectUrl($redirectUrl);
            }

            $response = $driver->redirect();
            $frontendUrlCookie = $this->makeFrontendUrlCookie($request);

            if ($frontendUrlCookie) {
                $response->withCookie($frontendUrlCookie);
            }

            return $response;
        } catch (\Exception $e) {
            Log::error('Google OAuth redirect failed: ' . $e->getMessage(), [
                'exception_class' => get_class($e),
            ]);

            return $this->redirectToFrontendError(
                'provider_failed',
                'Failed to initiate Google login: ' . $e->getMessage(),
                'google'
            );
        }
    }

    // Handles the Google provider callback and always sends the browser back to the frontend.
    public function handleGoogleCallback()
    {
        try {
            // Debug logging for OAuth callback
            Log::info('Google OAuth callback received', [
                'url' => request()->fullUrl(),
                'query_params' => request()->query(),
                'cookies' => request()->cookie('oauth_frontend_url'),
                'user_agent' => request()->userAgent(),
                'ip' => request()->ip(),
            ]);

            $googleUser = Socialite::driver('google')->stateless()
                ->setHttpClient(new \GuzzleHttp\Client(['verify' => config('app.env') === 'local' ? false : true]))
                ->user();

            Log::info('Google OAuth user retrieved', [
                'email' => $googleUser->getEmail(),
                'name' => $googleUser->getName(),
                'id' => $googleUser->getId(),
            ]);

            return $this->handleOAuthUser($googleUser, 'google');
        } catch (\Exception $e) {
            Log::error('Google OAuth error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'exception_class' => get_class($e),
            ]);
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
        if (!config('services.facebook.client_id')) {
            throw new \Exception('Facebook Client ID is missing. Check your .env file and configuration cache.');
        }

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
            $facebookUser = Socialite::driver('facebook')->stateless()
                ->setHttpClient(new \GuzzleHttp\Client(['verify' => config('app.env') === 'local' ? false : true]))
                ->user();
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

    private function handleOAuthUser($oauthUser, $provider)
    {
        $providerId = $provider . '_id';

        // FIRST: Try to find user by social ID (already linked)
        $user = User::where($providerId, $oauthUser->getId())->first();

        if (!$user) {
            // SECOND: Try to find user by email (registered but not linked yet)
            $user = User::where('email', $oauthUser->getEmail())->first();

            if (!$user) {
                Log::warning('Social login attempt failed: No account found with this email.', [
                    'provider'  => $provider,
                    'email'     => $oauthUser->getEmail(),
                    'social_id' => $oauthUser->getId(),
                ]);

                return $this->redirectToFrontendError(
                    'no_account',
                    'No CAPS account found with this email. Please register first.',
                    $provider
                );
            }

            // THIRD: Check if user is approved/registered
            $pendingStatusId = \DB::table('statuses')->where('name', 'pending')->first()->id ?? null;
            $registeredStatusId = \DB::table('statuses')->where('name', 'registered')->first()->id ?? null;

            if ($user->status_id === $pendingStatusId) {
                Log::warning('Social login blocked: Account is pending approval.', [
                    'provider' => $provider,
                    'userID' => $user->userID,
                    'email' => $oauthUser->getEmail(),
                ]);

                return $this->redirectToFrontendError(
                    'account_pending',
                    'Your account is pending approval. Please wait for administrator verification.',
                    $provider
                );
            }

            if ($user->status_id !== $registeredStatusId) {
                Log::warning('Social login blocked: Account not approved.', [
                    'provider' => $provider,
                    'userID' => $user->userID,
                    'email' => $oauthUser->getEmail(),
                ]);

                return $this->redirectToFrontendError(
                    'account_not_approved',
                    'Your account is not approved. Please wait for administrator verification.',
                    $provider
                );
            }

            // FOURTH: Auto-link the social account
            Log::info('Auto-linking social account to approved user.', [
                'provider' => $provider,
                'userID' => $user->userID,
                'email' => $oauthUser->getEmail(),
                'social_id' => $oauthUser->getId(),
            ]);

            $user->update([$providerId => $oauthUser->getId()]);
        }

        // STATUS CHECK: Mirror the same checks used in AuthController@login.
        $pendingStatusId = \DB::table('statuses')->where('name', 'pending')->first()->id ?? null;

        if ($pendingStatusId && $user->status_id === $pendingStatusId) {
            Log::warning('Social login blocked: Account is pending.', [
                'provider' => $provider,
                'userID' => $user->userID,
            ]);

            return $this->redirectToFrontendError(
                'account_pending',
                'Your account is pending approval. Please wait for administrator verification.',
                $provider
            );
        }

        // ACTIVE CHECK: Block inactive accounts just like AuthController@login.
        if (!$user->isActive) {
            Log::warning('Social login blocked: Account is inactive.', [
                'provider' => $provider,
                'userID' => $user->userID,
            ]);

            return $this->redirectToFrontendError(
                'account_inactive',
                'Your account is inactive. Please contact an administrator to reactivate your account.',
                $provider
            );
        }

        return $this->redirectToFrontendSuccess($user, $provider);
    }

    // Creates a Sanctum token and returns the user to the frontend callback route with success params.
    private function redirectToFrontendSuccess(User $user, string $provider)
    {
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
            'localhost:5173',
        ]), true);
    }

    // Provides a final localhost-style fallback when no trusted frontend URL was supplied.
    private function guessFrontendUrl(): string
    {
        $request = request();
        $scheme = $request->getScheme() ?: parse_url(config('app.url'), PHP_URL_SCHEME) ?: 'http';
        $host = $request->getHost() ?: parse_url(config('app.url'), PHP_URL_HOST) ?: 'localhost';

        return "{$scheme}://{$host}:5173";
    }

    // Mobile Google Login — accepts a Google ID token directly from a native app.
    public function mobileGoogleLogin(Request $request)
    {
        try {
            $request->validate([
                'idToken' => 'required|string',
                'email' => 'required|email',
                'name' => 'nullable|string',
                'providerId' => 'nullable|string',
            ]);

            // Verify the Google ID token via Google's tokeninfo endpoint
            $idToken = $request->input('idToken');
            $tokenInfoUrl = 'https://oauth2.googleapis.com/tokeninfo?id_token=' . urlencode($idToken);
            $tokenInfoResponse = @file_get_contents($tokenInfoUrl);

            if (!$tokenInfoResponse) {
                return response()->json(['message' => 'Unable to verify Google ID token'], 401);
            }

            $googlePayload = json_decode($tokenInfoResponse, true);

            if (isset($googlePayload['error']) || empty($googlePayload['email'])) {
                return response()->json(['message' => 'Invalid Google ID token'], 401);
            }

            // Ensure the token email matches the request email
            if ($googlePayload['email'] !== $request->input('email')) {
                return response()->json(['message' => 'Email mismatch with Google token'], 401);
            }

            $providerId = $request->input('providerId') ?? ($googlePayload['sub'] ?? null);

            // STRICT CHECK: Only allow login if the Google ID is already explicitly linked.
            $user = $providerId ? User::where('google_id', $providerId)->first() : null;

            if (!$user) {
                return response()->json([
                    'message' => 'This Google account is not linked to a CAPS account. Please log in normally and link it in your settings.',
                ], 404);
            }

            // Status checks (mirror handleOAuthUser logic)
            $pendingStatusId = \DB::table('statuses')->where('name', 'pending')->first()->id ?? null;
            if ($pendingStatusId && $user->status_id === $pendingStatusId) {
                return response()->json([
                    'message' => 'Your account is pending approval. Please wait for administrator verification.',
                ], 403);
            }

            if (!$user->isActive) {
                return response()->json([
                    'message' => 'Your account is inactive. Please contact an administrator to reactivate your account.',
                ], 403);
            }

            $token = $user->createToken('auth-token')->plainTextToken;

            return response()->json([
                'token' => $token,
                'user' => $user,
                'message' => 'Authenticated successfully',
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('Mobile Google login error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to authenticate with Google.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    // Links an OAuth provider to an already authenticated CAPS account after token verification.
    public function verifyLink(Request $request)
    {
        try {
            // Validate request inputs
            $request->validate([
                'email' => 'required|email|exists:users,email',
                'provider' => 'required|in:google,facebook',
                'oauth_token' => 'required|string'
            ]);

            // Look up user by email inside try-catch to prevent naked database stack traces
            $user = User::where('email', $request->email)->first();

            if (!$user) {
                return response()->json(['message' => 'User not found'], 404);
            }

            $provider = $request->provider;
            $providerId = $provider . '_id';

            if ($user->$providerId) {
                return response()->json(['message' => 'Account already linked'], 400);
            }

            // Verify OAuth token and link account
            $oauthUser = Socialite::driver($provider)
                ->setHttpClient(new \GuzzleHttp\Client(['verify' => config('app.env') === 'local' ? false : true]))
                ->userFromToken($request->oauth_token);

            $user->$providerId = $oauthUser->getId();
            $user->save();

            // Log in user and generate token
            Auth::login($user);
            $token = $user->createToken('auth-token')->plainTextToken;

            return response()->json([
                'message' => 'Account linked successfully',
                'user' => $user,
                'token' => $token
            ], 200);
        } catch (\Illuminate\Validation\ValidationException $e) {
            // Handle validation errors with proper error format
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Link verification error: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to verify OAuth token', 'error' => $e->getMessage()], 500);
        }
    }
}
