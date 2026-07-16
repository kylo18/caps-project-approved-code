<?php

namespace App\Events;

use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ExamResultUpdated
{
    use Dispatchable, SerializesModels;

    public $userId;
    public $score; // Now uses points instead of percentage
    public $finishedAt;
    public $scope;
    public $scopeId;
    public $programId;

    public function __construct(int $userId, float $score, $finishedAt, string $scope = 'global', ?int $scopeId = null, ?int $programId = null)
    {
        $this->userId = $userId;
        $this->score = $score; // Points (earnedPoints) instead of percentage
        $this->finishedAt = $finishedAt;
        $this->scope = $scope;
        $this->scopeId = $scopeId;
        $this->programId = $programId;
    }
}
