<?php

namespace Modules\PersonalClasses\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Modules\Users\Models\User;

class ClassQuizAttempt extends Model
{
    use HasFactory;

    protected $table = 'class_quiz_attempts';
    protected $primaryKey = 'attemptID';

    protected $fillable = [
        'classID',
        'personalQuizID',
        'studentID',
        'score',
        'totalScore',
        'accuracy',
        'isCompleted',
        'startedAt',
        'completedAt',
    ];

    protected $casts = [
        'score' => 'decimal:2',
        'totalScore' => 'decimal:2',
        'accuracy' => 'decimal:2',
        'isCompleted' => 'boolean',
        'startedAt' => 'datetime',
        'completedAt' => 'datetime',
    ];

    /**
     * Relationship: Attempt belongs to Class
     */
    public function class()
    {
        return $this->belongsTo(ClassModel::class, 'classID', 'classID');
    }

    /**
     * Relationship: Attempt belongs to PersonalQuiz
     */
    public function personalQuiz()
    {
        return $this->belongsTo(\Modules\PersonalExams\Models\PersonalQuiz::class, 'personalQuizID', 'personalQuizID');
    }

    /**
     * Relationship: Attempt belongs to Student (User)
     */
    public function student()
    {
        return $this->belongsTo(User::class, 'studentID', 'userID');
    }
}

