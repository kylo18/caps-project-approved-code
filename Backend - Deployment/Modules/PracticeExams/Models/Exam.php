<?php

namespace Modules\PracticeExams\Models;

use Illuminate\Database\Eloquent\Model;

class Exam extends Model
{
    protected $table = 'exams';

    protected $fillable = [
        'title',
        'description',
        'subject_id',
        'total_items',
        'passing_score',
        'time_limit',
        'status',
    ];

    protected $casts = [
        'total_items' => 'integer',
        'passing_score' => 'integer',
        'time_limit' => 'integer',
    ];
}
