<?php

use Illuminate\Support\Facades\Route;
use Modules\Users\Controllers\AuthController;
use Illuminate\Support\Facades\Redis;

use App\Services\LeaderboardService;
use Carbon\Carbon;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/leaderboard', function () {
        return inertia('leaderboard');
    })->name('leaderboard');
});
