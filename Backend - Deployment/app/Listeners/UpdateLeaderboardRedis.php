<?php

namespace App\Listeners;

use App\Events\ExamResultUpdated;
use App\Services\LeaderboardService;
use Illuminate\Support\Facades\Log;

class UpdateLeaderboardRedis
{
    protected $leaderboard;

    public function __construct(LeaderboardService $leaderboard)
    {
        $this->leaderboard = $leaderboard;
    }

    public function handle(ExamResultUpdated $event)
    {
        try {
            $composite = $this->leaderboard->computeComposite($event->score, $event->finishedAt);
            
            // Update global leaderboard
            $globalKey = $this->leaderboard->buildKey('global');
            $this->leaderboard->updateScoreConditionally($globalKey, $composite, $event->userId);
            
            // Update scope-specific leaderboard if provided
            if ($event->scopeId) {
                $scopeKey = $this->leaderboard->buildKey($event->scope, $event->scopeId);
                $this->leaderboard->updateScoreConditionally($scopeKey, $composite, $event->userId);
            }
            
            // Update program leaderboard if user has program
            if ($event->programId) {
                $programKey = $this->leaderboard->buildKey('program', $event->programId);
                $this->leaderboard->updateScoreConditionally($programKey, $composite, $event->userId);
            }
            
        } catch (\Exception $e) {
            Log::warning('Failed to update Redis leaderboard: ' . $e->getMessage());
        }
    }
}
