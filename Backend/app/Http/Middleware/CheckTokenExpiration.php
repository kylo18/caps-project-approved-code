<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class CheckTokenExpiration
{
    public function handle(Request $request, Closure $next)
    {
        $token = $request->user()?->currentAccessToken();

        if ($token && $token->expires_at && now()->greaterThan($token->expires_at)) {
            $token->delete(); // Optional: revoke token
            return response()->json(['message' => 'Token expired. Please log in again.'], 401);
        }

        return $next($request);
    }
}
