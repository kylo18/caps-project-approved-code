<?php

namespace Modules\App\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;

class AppController extends Controller
{
    public function getVersion(): JsonResponse
    {
        return response()->json([
            'version' => 'v1.6.0'
        ]);
    }
}
