<?php

namespace Modules\ExamQuestions\Models;

use Illuminate\Database\Eloquent\Model;
use Modules\Exams\Models\Exam;
use App\Models\Modules\Questions\Models\Question;

class ExamQuestion extends Model
{
    protected $table = 'exam_questions';
    protected $primaryKey = 'examQuestionID';
    protected $fillable = ['examID', 'questionID', 'choiceID', 'isCorrect'];

    public function exam()
    {
        return $this->belongsTo(Exam::class, 'examID');
    }

    public function question()
    {
        return $this->belongsTo(Question::class, 'questionID');
    }
}
