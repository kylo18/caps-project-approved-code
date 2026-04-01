<?php

namespace Modules\Analytics\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExamDifficultyAnalytics extends Model
{
    protected $table = 'exam_difficulty_analytics';

    protected $fillable = [
        'attempt_id',
        'user_id',
        'difficulty',
        'correct',
        'total',
        'score_pct',
    ];

    protected $casts = [
        'score_pct' => 'decimal:2',
    ];

    public function attempt(): BelongsTo
    {
        return $this->belongsTo(ExamAttempt::class, 'attempt_id');
    }
}