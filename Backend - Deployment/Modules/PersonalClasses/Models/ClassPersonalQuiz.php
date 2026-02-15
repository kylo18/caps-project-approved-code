<?php

namespace Modules\PersonalClasses\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ClassPersonalQuiz extends Model
{
    use HasFactory;

    protected $table = 'class_personal_quizzes';
    protected $primaryKey = 'classPersonalQuizID';

    protected $fillable = [
        'classID',
        'personalQuizID',
        'startDate',
        'deadlineDate',
    ];

    protected $casts = [
        'startDate' => 'datetime',
        'deadlineDate' => 'datetime',
    ];

    /**
     * Relationship: ClassPersonalQuiz belongs to Class
     */
    public function class()
    {
        return $this->belongsTo(ClassModel::class, 'classID', 'classID');
    }

    /**
     * Relationship: ClassPersonalQuiz belongs to PersonalQuiz
     */
    public function personalQuiz()
    {
        return $this->belongsTo(\Modules\PersonalExams\Models\PersonalQuiz::class, 'personalQuizID', 'personalQuizID');
    }

    /**
     * Relationship: ClassPersonalQuiz has many StudentQuizResults
     */
    public function studentQuizResults()
    {
        return $this->hasMany(\Modules\PersonalExams\Models\StudentQuizResult::class, 'class_quiz_assignment_id', 'classPersonalQuizID');
    }
}

