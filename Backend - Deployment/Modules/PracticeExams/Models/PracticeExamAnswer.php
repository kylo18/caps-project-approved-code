<?php

namespace Modules\PracticeExams\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Modules\Questions\Models\Question;
use Modules\Choices\Models\Choice;

class PracticeExamAnswer extends Model
{
    use HasFactory;

    protected $table = 'practice_exam_answers';

    protected $fillable = [
        'result_id',
        'user_id',
        'question_id',
        'selected_choice_id',
        'is_correct',
    ];

    public function result()
    {
        return $this->belongsTo(PracticeExamResult::class, 'result_id', 'resultID');
    }

    public function question()
    {
        return $this->belongsTo(Question::class, 'question_id', 'questionID');
    }

    public function selectedChoice()
    {
        return $this->belongsTo(Choice::class, 'selected_choice_id', 'choiceID');
    }
}
