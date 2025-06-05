<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Laravel\Sanctum\PersonalAccessToken;
use Carbon\Carbon;

class TokenExpirationMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        if ($request->is('api/logout')) {
            return $next($request);
        }

        $token = $request->bearerToken();
        if (!$token) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $accessToken = PersonalAccessToken::findToken($token);
        if (!$accessToken) {
            return response()->json(['message' => 'Invalid token'], 401);
        }

        if (Carbon::parse($accessToken->created_at)->addHours(3)->isPast()) {
            return response()->json(['message' => 'Token has expired'], 401);
        }

        return $next($request);
    }
}
