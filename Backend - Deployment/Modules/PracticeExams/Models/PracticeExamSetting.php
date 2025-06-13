<?php

namespace Modules\PracticeExams\Models;

use Illuminate\Database\Eloquent\Model;
use Modules\Subjects\Models\Subject;
use Modules\Users\Models\User;

class PracticeExamSetting extends Model
{
    protected $fillable = [
        'subjectID',
        'isEnabled',
        'enableTimer',
        'duration_minutes',
        'coverage',
        'easy_percentage',
        'moderate_percentage',
        'hard_percentage',
        'total_items',
        'createdBy',
    ];

    public function subject()
    {
        return $this->belongsTo(Subject::class, 'subjectID');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'createdBy');
    }
}
