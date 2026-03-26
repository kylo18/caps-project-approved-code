<?php

namespace Modules\Analytics\Models;

use Illuminate\Database\Eloquent\Model;

class QuestionStatsDaily extends Model
{
    protected $table = 'question_stats_daily';

    protected $fillable = [
        'question_id',
        'topic_id',
        'stat_date',
        'total_attempts',
        'total_correct',
        'total_incorrect',
        'total_skipped',
        'error_rate',
    ];

    protected $casts = [
        'stat_date'  => 'date',
        'error_rate' => 'decimal:4',
    ];
}