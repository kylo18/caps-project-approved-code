<?php

namespace Modules\PersonalExams\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Modules\PersonalClasses\Models\ClassPersonalQuiz;
use Modules\Users\Models\User;

class StudentQuizResult extends Model
{
    use HasFactory;

    protected $table = 'student_quiz_results';

    protected $fillable = [
        'class_quiz_assignment_id',
        'studentID',
        'score',
        'total_score',
        'percentage',
        'attempt_number',
        'started_at',
        'submitted_at',
        'time_taken_seconds',
        'isRecorded',
        'isPassed',
    ];

    protected $casts = [
        'score' => 'decimal:2',
        'total_score' => 'decimal:2',
        'percentage' => 'decimal:2',
        'attempt_number' => 'integer',
        'started_at' => 'datetime',
        'submitted_at' => 'datetime',
        'time_taken_seconds' => 'integer',
        'isRecorded' => 'boolean',
        'isPassed' => 'boolean',
    ];

    /**
     * Relationship: StudentQuizResult belongs to ClassPersonalQuiz
     */
    public function classQuizAssignment()
    {
        return $this->belongsTo(ClassPersonalQuiz::class, 'class_quiz_assignment_id', 'classPersonalQuizID');
    }

    /**
     * Relationship: StudentQuizResult belongs to User (Student)
     */
    public function student()
    {
        return $this->belongsTo(User::class, 'studentID', 'userID');
    }

    /**
     * Per-question outcomes (for analytics: weak subjects / weak questions).
     */
    public function answerDetails(): HasMany
    {
        return $this->hasMany(StudentQuizAnswerDetail::class, 'student_quiz_result_id', 'id');
    }
}



