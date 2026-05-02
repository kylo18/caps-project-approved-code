<?php

namespace Modules\Users\Models;

use Illuminate\Database\Eloquent\Model;

class StudentTeacherEnrollment extends Model
{
    protected $table = 'student_teacher_enrollments';

    protected $fillable = [
        'student_id',
        'teacher_id',
    ];
} 