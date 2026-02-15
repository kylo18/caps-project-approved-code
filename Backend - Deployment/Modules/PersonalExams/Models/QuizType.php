<?php

namespace Modules\PersonalExams\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Modules\PersonalExams\Models\PersonalQuiz;

class QuizType extends Model
{
    use HasFactory;

    protected $table = 'quiz_types';

    protected $fillable = [
        'name',
        'description',
    ];

    public function personalQuizzes()
    {
        return $this->hasMany(PersonalQuiz::class, 'quiz_type_id', 'id');
    }
}

