<?php

use Illuminate\Support\Facades\Route;
use Modules\Users\Controllers\AuthController;
use Illuminate\Support\Facades\Redis;
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
// Download URL: http://your-ip/download/caps.apk
Route::get('/download/caps.apk', function (): BinaryFileResponse {
    $path = public_path('apk/CAPS.apk');

    if (!file_exists($path)) {
        abort(404, 'APK not found. Please upload app-release.apk to public/apk/');
    }

    return response()->file($path, [
        'Content-Type' => 'application/vnd.android.package-archive',
        'Content-Disposition' => 'attachment; filename="CAPS.apk"',
        'Cache-Control' => 'no-store, no-cache',
    ]);
});
