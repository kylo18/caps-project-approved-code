<?php

namespace Modules\PersonalExams\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Modules\Users\Models\User;
use Modules\PersonalExams\Models\PersonalQuiz;

class StudentQuizAttempt extends Model
{
    use HasFactory;

    protected $table = 'student_quiz_attempts';

    protected $primaryKey = 'attemptID';

    protected $fillable = [
        'personalQuizID',
        'studentID',
        'attemptNumber',
        'startedAt',
        'completedAt',
    ];

    protected $casts = [
        'attemptNumber' => 'integer',
        'startedAt' => 'datetime',
        'completedAt' => 'datetime',
    ];

    /**
     * Relationship: StudentQuizAttempt belongs to PersonalQuiz
     */
    public function personalQuiz()
    {
        return $this->belongsTo(PersonalQuiz::class, 'personalQuizID', 'personalQuizID');
    }

    /**
     * Relationship: StudentQuizAttempt belongs to Student (User)
     */
    public function student()
    {
        return $this->belongsTo(User::class, 'studentID', 'userID');
    }
}

