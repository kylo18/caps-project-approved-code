<?php

namespace Modules\App\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;

class AppController extends Controller
{
    public function getVersion(): JsonResponse
    {
        $versionPath = dirname(__DIR__, 3) . '/version.json';
        $version = '0.0.0';

        if (file_exists($versionPath)) {
            $data = json_decode(file_get_contents($versionPath), true);
            $version = $data['version'] ?? '0.0.0';
        }

        return response()->json([
            'version' => 'v' . $version
        ]);
    }
}
