<?php

namespace Modules\PersonalExams\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Questions\Models\Question;
use Modules\Subjects\Models\Subject;
use Modules\Users\Models\User;

class StudentQuizAnswerDetail extends Model
{
    protected $table = 'student_quiz_answer_details';

    protected $fillable = [
        'student_quiz_result_id',
        'studentID',
        'personalQuizQuestionID',
        'bank_questionID',
        'subjectID',
        'selected_personalQuizChoiceID',
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
        return $this->belongsTo(StudentQuizResult::class, 'student_quiz_result_id', 'id');
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'studentID', 'userID');
    }

    public function personalQuizQuestion(): BelongsTo
    {
        return $this->belongsTo(PersonalQuizQuestion::class, 'personalQuizQuestionID', 'personalQuizQuestionID');
    }

    public function bankQuestion(): BelongsTo
    {
        return $this->belongsTo(Question::class, 'bank_questionID', 'questionID');
    }

    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class, 'subjectID', 'subjectID');
    }

    public function selectedChoice(): BelongsTo
    {
        return $this->belongsTo(PersonalQuizChoice::class, 'selected_personalQuizChoiceID', 'personalQuizChoiceID');
    }
}
