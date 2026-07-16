<?php

use Illuminate\Support\Facades\Route;
use Modules\Users\Controllers\AuthController;
use Illuminate\Support\Facades\Redis;
use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken;
use Illuminate\Session\Middleware\StartSession;
use Illuminate\View\Middleware\ShareErrorsFromSession;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

use App\Services\LeaderboardService;
use Carbon\Carbon;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/leaderboard', function () {
        return inertia('leaderboard');
    })->name('leaderboard');
});

// ─── APK Download ────────────────────────────────────────────────────────────
// Place app-release.apk in: public/apk/CAPS.apk
// Download URLs:
// - http://your-ip/download/caps.apk
// - http://your-ip/downloads/caps.apk (compatibility alias for manual browser checks)
$serveCapsApk = function (): BinaryFileResponse {
    $path = public_path('apk/CAPS.apk');
    clearstatcache(true, $path);

    if (!file_exists($path)) {
        abort(404, 'APK not found. Please upload app-release.apk to public/apk/');
    }

    return response()->file($path, [
        'Content-Type' => 'application/vnd.android.package-archive',
        'Content-Disposition' => 'attachment; filename="CAPS.apk"',
        'Cache-Control' => 'no-store, no-cache',
    ]);
};

foreach (['/download/caps.apk', '/downloads/caps.apk'] as $apkDownloadPath) {
    Route::get($apkDownloadPath, $serveCapsApk)->withoutMiddleware([
        StartSession::class,
        ShareErrorsFromSession::class,
        VerifyCsrfToken::class,
    ]);
}
