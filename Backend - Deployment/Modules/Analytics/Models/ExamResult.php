<?php

namespace Modules\Analytics\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExamResult extends Model
{
    protected $table = 'exam_results';

    // difficulty text column replaced with difficulty_id FK
    protected $fillable = [
        'attempt_id',
        'question_id',
        'topic_id',
        'subject_id',
        'difficulty_id',
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

    /** Difficulty via FK (replaces text difficulty column) */
    public function difficulty(): BelongsTo
    {
        return $this->belongsTo(\Modules\Questions\Models\Difficulty::class, 'difficulty_id');
    }

    public function scopeForTopic($query, int $topicId)
    {
        return $query->where('topic_id', $topicId);
    }

    /** Scope by difficulty — uses FK */
    public function scopeForDifficulty($query, int $difficultyId)
    {
        return $query->where('difficulty_id', $difficultyId);
    }

    /** Scope by difficulty name (convenience) */
    public function scopeForDifficultyName($query, string $name)
    {
        return $query->whereHas('difficulty', fn($q) => $q->where('name', $name));
    }
}