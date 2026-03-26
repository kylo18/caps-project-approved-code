<?php

namespace Modules\Analytics\Models;

use Illuminate\Database\Eloquent\Model;

class LessonView extends Model
{
    protected $table = 'lesson_views';

    protected $fillable = [
        'user_id',
        'lesson_id',
        'course_id',
        'subject_id',
    ];
}