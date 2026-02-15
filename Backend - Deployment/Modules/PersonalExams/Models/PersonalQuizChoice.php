<?php

namespace Modules\PersonalExams\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Modules\PersonalExams\Models\PersonalQuizQuestion;

class PersonalQuizChoice extends Model
{
    use HasFactory;

    protected $table = 'personal_quiz_choices';
    protected $primaryKey = 'personalQuizChoiceID';

    protected $fillable = [
        'personalQuizQuestionID',
        'choiceText',
        'image',
        'isCorrect',
        'position',
    ];

    protected $casts = [
        'isCorrect' => 'boolean',
        'position' => 'integer',
    ];

    /**
     * Relationship: PersonalQuizChoice belongs to PersonalQuizQuestion
     */
    public function personalQuizQuestion()
    {
        return $this->belongsTo(PersonalQuizQuestion::class, 'personalQuizQuestionID', 'personalQuizQuestionID');
    }
}

