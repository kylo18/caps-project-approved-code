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
        $isForced = false;

        if (file_exists($versionPath)) {
            $data = json_decode(file_get_contents($versionPath), true);
            $version = ltrim((string) ($data['version'] ?? '0.0.0'), 'vV');
            $isForced = filter_var(
                $data['isForced'] ?? $data['is_forced'] ?? false,
                FILTER_VALIDATE_BOOLEAN
            );
        }

        return response()->json([
            'version' => 'v' . $version,
            'isForced' => $isForced,
        ]);
    }
}
