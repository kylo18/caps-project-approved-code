<?php

namespace Modules\PersonalExams\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Modules\PersonalExams\Models\PersonalQuiz;

class PersonalQuizSetting extends Model
{
    use HasFactory;

    protected $table = 'personal_quiz_settings';

    protected $primaryKey = 'personalQuizSettingID';

    protected $fillable = [
        'personalQuizID',
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
     * Relationship: PersonalQuizSetting belongs to PersonalQuiz
     */
    public function personalQuiz()
    {
        return $this->belongsTo(PersonalQuiz::class, 'personalQuizID', 'personalQuizID');
    }
}

