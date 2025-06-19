<?php

namespace App\Http\Middleware;

use Closure;

class ImageCors
{
    public function handle($request, Closure $next)
    {
        // Handle preflight (OPTIONS) requests
        if ($request->getMethod() === 'OPTIONS') {
            $response = response('', 204);
        } else {
            $response = $next($request);
        }

        $response->headers->set('Access-Control-Allow-Origin', '*');
        $response->headers->set('Access-Control-Allow-Methods', 'GET, OPTIONS');
        $response->headers->set('Access-Control-Allow-Headers', 'Origin, Content-Type, Accept, Authorization, X-Requested-With');

        return $response;
    }
}