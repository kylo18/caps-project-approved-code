<?php

namespace Modules\Analytics\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExamAnalytics extends Model
{
    protected $table = 'exam_analytics';

    protected $fillable = [
        'attempt_id',
        'user_id',
        'overall_score',
        'rank',
        'total_candidates',
        'percentile',
        'improvement_pct',
        'has_weak_topics',
    ];

    protected $casts = [
        'overall_score'   => 'decimal:2',
        'percentile'      => 'decimal:2',
        'improvement_pct' => 'decimal:2',
        'has_weak_topics' => 'boolean',
    ];

    public function attempt(): BelongsTo
    {
        return $this->belongsTo(ExamAttempt::class, 'attempt_id');
    }
}