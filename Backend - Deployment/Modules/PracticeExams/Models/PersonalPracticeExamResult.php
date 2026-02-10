<?php

namespace Modules\PracticeExams\Models;

use Illuminate\Database\Eloquent\Model;
use Modules\Users\Models\User;
use Modules\Subjects\Models\Subject;

class PersonalPracticeExamResult extends Model
{
    protected $table = 'personal_practice_exam_results';

    protected $fillable = [
        'student_id',
        'subjectID',
        'teacher_id',
        'totalPoints',
        'earnedPoints',
        'percentage',
    ];

    public function student()
    {
        return $this->belongsTo(User::class, 'student_id', 'userID');
    }

    public function teacher()
    {
        return $this->belongsTo(User::class, 'teacher_id', 'userID');
    }

    public function subject()
    {
        return $this->belongsTo(Subject::class, 'subjectID', 'subjectID');
    }
} 