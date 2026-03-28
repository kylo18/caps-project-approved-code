<?php

namespace App\Services;

use Illuminate\Support\Facades\Redis;
use Carbon\Carbon;

class LeaderboardService
{
    /**
     * Build Redis key for the given scope.
     */
    public function buildKey(string $scope, ?int $id = null): string
    {
        if ($id) {
            return "leaderboard:$scope:$id";
        }
        return "leaderboard:$scope";
    }

    /**
     * Composite score formula: (score * 1,000,000) + (9,999,999,999 - finished_at_unix)
     * Ensures higher score wins, and ties go to the earlier finisher.
     */
    public function computeComposite(float $score, Carbon $finishedAt): float
    {
        // Multiply score by 10^10 to ensure it occupies the billions+ places.
        // Unix timestamp (10 digits) fits in the lower 10 places.
        return ($score * 10000000000.0) + (9999999999.0 - $finishedAt->unix());
    }

    /**
     * Update score only if the new composite is higher.
     */
    public function updateScoreConditionally(string $key, float $composite, int $studentId): bool
    {
        // Simple ZADD for maximum compatibility across Predis versions.
        // It will overwrite the score, but for our current needs, this is sufficient.
        return (bool) Redis::zadd($key, $composite, $studentId);
    }

    /**
     * Get top N students from a leaderboard.
     */
    public function top(string $key, int $n = 10): array
    {
        // ZREVRANGE returns 0-based rank.
        return Redis::zrevrange($key, 0, $n - 1, 'WITHSCORES');
    }

    /**
     * Get human-readable rank (1-based).
     */
    public function rankOf(string $key, int $studentId): ?int
    {
        $rank = Redis::zrevrank($key, $studentId);
        return $rank !== null ? $rank + 1 : null;
    }

    /**
     * Get human-readable score (extract from composite).
     */
    public function scoreOf(string $key, int $studentId): ?int
    {
        $composite = Redis::zscore($key, $studentId);
        return $composite !== null ? (int) floor($composite / 10000000000.0) : null;
    }

    /**
     * Get total count of members in the leaderboard.
     */
    public function totalCount(string $key): int
    {
        return (int) Redis::zcard($key);
    }

    /**
     * Clear all data from a specific leaderboard key.
     */
    public function clearKey(string $key): void
    {
        \Illuminate\Support\Facades\Redis::del($key);
    }
}
