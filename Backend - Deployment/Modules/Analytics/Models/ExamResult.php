<?php

namespace Modules\Analytics\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExamResult extends Model
{
    protected $table = 'exam_results';

    protected $fillable = [
        'attempt_id',
        'question_id',
        'topic_id',
        'subject_id',
        'difficulty',
        'is_correct',
        'is_skipped',
        'time_spent',
    ];

    protected $casts = [
        'is_correct' => 'boolean',
        'is_skipped' => 'boolean',
        'time_spent' => 'integer',
    ];

    public function attempt(): BelongsTo
    {
        return $this->belongsTo(ExamAttempt::class, 'attempt_id');
    }

    public function scopeForTopic($query, int $topicId)
    {
        return $query->where('topic_id', $topicId);
    }

    public function scopeForDifficulty($query, string $difficulty)
    {
        return $query->where('difficulty', $difficulty);
    }
}