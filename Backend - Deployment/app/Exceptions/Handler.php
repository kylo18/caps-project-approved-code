<?php

namespace App\Exceptions;

use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Throwable;
use Symfony\Component\Cache\Exception\CacheException;

class Handler extends ExceptionHandler
{
    /**
     * Register the exception handling callbacks for the application.
     */
    public function register(): void
    {
        $this->renderable(function (AuthenticationException $e, $request) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        });
    }

    public function render($request, Throwable $exception)
    {
        // Specific, safe (hardcoded) hint for a common misconfiguration.
        if ($exception instanceof CacheException && str_contains($exception->getMessage(), 'Please provide a valid cache path')) {
            return response()->json([
                'message' => 'Cache directory is missing or not writable. Please ensure bootstrap/cache exists and is writable.'
            ], 500);
        }

        if ($request->expectsJson()) {
            // SECURITY: never return the raw exception message to clients.
            // Centralized API exception handling lives in bootstrap/app.php;
            // this is a safe fallback should this (currently unregistered)
            // handler ever be wired up.
            return response()->json([
                'message' => 'An unexpected error occurred. Please try again later.'
            ], 500);
        }

        return parent::render($request, $exception);
    }
}
