<?php

namespace Modules\PersonalExams\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Modules\PersonalClasses\Models\ClassPersonalQuiz;

class PersonalQuizSetting extends Model
{
    use HasFactory;

    // Settings are now stored per quiz assignment inside a class
    // (class_personal_quiz_settings), but we keep the model name
    // and field naming convention for compatibility.
    protected $table = 'class_personal_quiz_settings';

    protected $primaryKey = 'personalQuizSettingID';

    protected $fillable = [
        'classPersonalQuizID',
        'startTime',
        'endTime',
        'quizAttempts',
        'quizTimer',
        'quizTimerEnabled',
        'shuffleQuestions',
        'shuffleChoices',
        'showCorrectAnswers',
        'showCorrectQuestion',
        'autoSubmitOnTimeout',
        'allowLateSubmission',
        'showScoreAfterQuiz',
        // Legacy fields for backward compatibility
        'enableTimer',
        'duration_minutes',
    ];

    protected $casts = [
        'startTime' => 'datetime',
        'endTime' => 'datetime',
        'quizAttempts' => 'integer',
        'quizTimer' => 'integer',
        'quizTimerEnabled' => 'boolean',
        'shuffleQuestions' => 'boolean',
        'shuffleChoices' => 'boolean',
        'showCorrectAnswers' => 'boolean',
        'showCorrectQuestion' => 'boolean',
        'autoSubmitOnTimeout' => 'boolean',
        'allowLateSubmission' => 'boolean',
        'showScoreAfterQuiz' => 'boolean',
        // Legacy fields
        'enableTimer' => 'boolean',
        'duration_minutes' => 'integer',
    ];

    /**
     * Relationship: PersonalQuizSetting belongs to ClassPersonalQuiz assignment.
     */
    public function classPersonalQuiz()
    {
        return $this->belongsTo(ClassPersonalQuiz::class, 'classPersonalQuizID', 'classPersonalQuizID');
    }
}

