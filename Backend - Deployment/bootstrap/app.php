<?php

use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Middleware\HandleCors;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->web(append: [
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);
        
        // Ensure CORS is handled for API routes
        $middleware->api(prepend: [
            HandleCors::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // Centralized API exception handling: never leak raw exception strings,
        // stack traces, SQL, or paths to clients. Return a generic message plus
        // a correlation id (ref) that ties the client response to a server log
        // entry. Enforced regardless of APP_DEBUG.
        $exceptions->render(function (Throwable $e, $request) {
            if (! $request->is('api/*') && ! $request->expectsJson()) {
                return null; // non-API requests use default handling
            }

            // Let the framework render exceptions that already produce safe,
            // intentional responses (validation 422, auth 401, 403/404, etc.).
            if ($e instanceof ValidationException
                || $e instanceof AuthenticationException
                || $e instanceof HttpExceptionInterface) {
                return null;
            }

            $ref = (string) Str::uuid();
            Log::error('[' . $ref . '] ' . $e->getMessage(), ['exception' => $e]);

            return response()->json([
                'message' => 'An unexpected error occurred. Please try again later.',
                'ref' => $ref,
            ], 500);
        });
    })->create();
