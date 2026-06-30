<?php

namespace Modules\PersonalExams\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Modules\Subjects\Models\Subject;
use Modules\Users\Models\User;
use Modules\PersonalExams\Models\QuizType;
use Modules\PersonalExams\Models\PersonalQuizQuestion;
use Modules\PersonalExams\Models\PersonalQuizSetting;
use Modules\Questions\Models\Coverage;
use Modules\PersonalClasses\Models\ClassPersonalQuiz;

class PersonalQuiz extends Model
{
    use HasFactory;

    protected $table = 'personal_quizzes';

    protected $primaryKey = 'personalQuizID';

    protected $fillable = [
        'title',
        'description',
        'instruction',
        'quiz_type_id',
        'subjectID',      // Nullable for customized quizzes
        'coverage_id',
        'created_by',
        'isArchived',
    ];

    protected $casts = [
        'isArchived' => 'boolean',
    ];

    public function subject()
    {
        return $this->belongsTo(Subject::class, 'subjectID', 'subjectID');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by', 'userID');
    }

    public function quizType()
    {
        return $this->belongsTo(QuizType::class, 'quiz_type_id', 'id');
    }

    /**
     * Relationship: PersonalQuiz has many PersonalQuizQuestions
     */
    public function questions()
    {
        return $this->hasMany(PersonalQuizQuestion::class, 'personalQuizID', 'personalQuizID');
    }

    /**
     * Per-class settings live on the class assignment (`class_personal_quizzes`).
     *
     * This relation is kept for backward compatibility, but it does **not**
     * represent a single global setting for the quiz; it returns the first
     * available class-assignment setting (if any).
     */
    public function setting()
    {
        return $this->hasOneThrough(
            PersonalQuizSetting::class,
            ClassPersonalQuiz::class,
            'personalQuizID',        // Foreign key on class_personal_quizzes...
            'classPersonalQuizID',   // Foreign key on class_personal_quiz_settings...
            'personalQuizID',        // Local key on personal_quizzes...
            'classPersonalQuizID'    // Local key on class_personal_quizzes...
        );
    }

    public function coverage()
    {
        return $this->belongsTo(Coverage::class, 'coverage_id', 'id');
    }

    /**
     * Relationship: PersonalQuiz belongs to many Classes
     */
    public function classes()
    {
        return $this->belongsToMany(
            \Modules\PersonalClasses\Models\ClassModel::class,
            'class_personal_quizzes',
            'personalQuizID',
            'classID',
            'personalQuizID',
            'classID'
        )->withPivot('startDate', 'deadlineDate')
          ->withTimestamps();
    }

    /**
     * Relationship: PersonalQuiz has many Class Quiz Attempts
     */
    public function classQuizAttempts()
    {
        return $this->hasMany(\Modules\PersonalClasses\Models\ClassQuizAttempt::class, 'personalQuizID', 'personalQuizID');
    }

    /**
     * Relationship: PersonalQuiz has many Student Quiz Attempts
     */
    public function studentQuizAttempts()
    {
        return $this->hasMany(\Modules\PersonalExams\Models\StudentQuizAttempt::class, 'personalQuizID', 'personalQuizID');
    }
}

