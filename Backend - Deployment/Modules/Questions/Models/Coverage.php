<?php

namespace Modules\Questions\Models;

use Illuminate\Database\Eloquent\Model;
use Modules\Questions\Models\Question;

class Coverage extends Model
{
    protected $fillable = ['name'];

    public function questions()
    {
        return $this->hasMany(Question::class);
    }

    /**
     * Relationship: Coverage has many PersonalQuizzes
     */
    public function personalQuizzes()
    {
        return $this->hasMany(\Modules\PersonalExams\Models\PersonalQuiz::class, 'coverage_id', 'id');
    }
}
