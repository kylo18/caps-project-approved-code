<?php

namespace Modules\PersonalExams\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Modules\PersonalExams\Models\PersonalQuiz;
use Modules\Questions\Models\Question;

class PersonalQuizQuestion extends Model
{  
    use HasFactory;

    protected $table = 'personal_quiz_questions';

    protected $primaryKey = 'personalQuizQuestionID';

    protected $fillable = [
        'personalQuizID',
        'questionID',
        'personalQuizSubjectID',
        'personalQuizUserID',
        'personalQuizQuestionText',
        'personalQuizImage',
        'personalQuizScore',
        'personalQuizCoverageId',
    ];

    /**
     * Relationship: PersonalQuizQuestion belongs to PersonalQuiz
     */
    public function personalQuiz()
    {
        return $this->belongsTo(PersonalQuiz::class, 'personalQuizID', 'personalQuizID');
    }

    /**
     * Relationship: PersonalQuizQuestion belongs to Question
     */
    public function question()
    {
        return $this->belongsTo(Question::class, 'questionID', 'questionID');
    }

    /**
     * Relationship: PersonalQuizQuestion belongs to Subject (via personalQuizSubjectID)
     */
    public function personalQuizSubject()
    {
        return $this->belongsTo(\Modules\Subjects\Models\Subject::class, 'personalQuizSubjectID', 'subjectID');
    }

    /**
     * Relationship: PersonalQuizQuestion belongs to User (via personalQuizUserID)
     */
    public function personalQuizUser()
    {
        return $this->belongsTo(\Modules\Users\Models\User::class, 'personalQuizUserID', 'userID');
    }

    /**
     * Relationship: PersonalQuizQuestion belongs to Coverage
     */
    public function personalQuizCoverage()
    {
        return $this->belongsTo(\Modules\Questions\Models\Coverage::class, 'personalQuizCoverageId', 'id');
    }

    /**
     * Relationship: PersonalQuizQuestion has many PersonalQuizChoices
     */
    public function personalQuizChoices()
    {
        return $this->hasMany(PersonalQuizChoice::class, 'personalQuizQuestionID', 'personalQuizQuestionID');
    }
}


