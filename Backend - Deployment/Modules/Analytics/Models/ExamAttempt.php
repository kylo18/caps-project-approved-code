<?php

namespace Modules\Analytics\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ExamAttempt extends Model
{
    protected $table = 'exam_attempts';

    protected $fillable = [
        'user_id',
        'exam_id',
        'started_at',
        'finished_at',
        'status',
    ];

    protected $casts = [
        'started_at'  => 'datetime',
        'finished_at' => 'datetime',
    ];

    public function results(): HasMany
    {
        return $this->hasMany(ExamResult::class, 'attempt_id');
    }

    public function analytics(): HasMany
    {
        return $this->hasMany(ExamAnalytics::class, 'attempt_id');
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }
}