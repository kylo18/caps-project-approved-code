<?php

namespace Modules\Analytics\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExamRecommendation extends Model
{
    protected $table = 'exam_recommendations';

    protected $fillable = [
        'attempt_id',
        'user_id',
        'recommendation',
        'type',
    ];

    public function attempt(): BelongsTo
    {
        return $this->belongsTo(ExamAttempt::class, 'attempt_id');
    }
}