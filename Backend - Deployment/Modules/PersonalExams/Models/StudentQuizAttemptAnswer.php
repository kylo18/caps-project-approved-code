<?php

namespace Modules\PersonalExams\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\PersonalClasses\Models\ClassPersonalQuiz;
use Modules\Questions\Models\Question;
use Modules\Subjects\Models\Subject;
use Modules\Users\Models\User;

class StudentQuizAttemptAnswer extends Model
{
    protected $table = 'student_quiz_attempt_answers';

    protected $fillable = [
        'student_quiz_result_id',
        'studentID',
        'class_quiz_assignment_id',
        'personal_quiz_question_id',
        'selected_personal_quiz_choice_id',
        'subject_id',
        'bank_question_id',
        'is_correct',
        'points_possible',
        'points_earned',
        'question_snapshot',
    ];

    protected $casts = [
        'is_correct' => 'boolean',
        'points_possible' => 'decimal:2',
        'points_earned' => 'decimal:2',
        'question_snapshot' => 'array',
    ];

    public function studentQuizResult(): BelongsTo
    {
        return $this->belongsTo(StudentQuizResult::class, 'student_quiz_result_id');
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'studentID', 'userID');
    }

    public function classQuizAssignment(): BelongsTo
    {
        return $this->belongsTo(ClassPersonalQuiz::class, 'class_quiz_assignment_id', 'classPersonalQuizID');
    }

    public function personalQuizQuestion(): BelongsTo
    {
        return $this->belongsTo(PersonalQuizQuestion::class, 'personal_quiz_question_id', 'personalQuizQuestionID');
    }

    public function selectedChoice(): BelongsTo
    {
        return $this->belongsTo(PersonalQuizChoice::class, 'selected_personal_quiz_choice_id', 'personalQuizChoiceID');
    }

    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class, 'subject_id', 'subjectID');
    }

    public function bankQuestion(): BelongsTo
    {
        return $this->belongsTo(Question::class, 'bank_question_id', 'questionID');
    }
}
