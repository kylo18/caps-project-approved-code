<?php

namespace Modules\Analytics\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExamTopicAnalytics extends Model
{
    protected $table = 'exam_topic_analytics';

    protected $fillable = [
        'attempt_id',
        'user_id',
        'topic_id',
        'subject_id',
        'correct',
        'total',
        'score_pct',
        'is_weak',
    ];

    protected $casts = [
        'score_pct' => 'decimal:2',
        'is_weak'   => 'boolean',
    ];

    public function attempt(): BelongsTo
    {
        return $this->belongsTo(ExamAttempt::class, 'attempt_id');
    }
}