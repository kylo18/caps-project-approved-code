<?php

namespace app\Models\Modules\PracticeExam\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Modules\Users\Models\User;
use app\Models\Modules\Subjects\Models\Subject;
use app\Models\Modules\Questions\Models\Question;
use Modules\PracticeExam\Models\PracticeSetting;

class PracticeExam extends Model
{
    protected $fillable = [
        'subjectID',
        'createdBy',
        'coverage',
        'numItems',
        'difficultyDistributionId',
        'easyPercentage',
        'moderatePercentage',
        'hardPercentage',
        'status'
    ];

    public function subject()
    {
        return $this->belongsTo(Subject::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'createdBy');
    }

    public function questions()
    {
        return $this->belongsToMany(Question::class, 'practice_exam_questions');
    }

    public function practiceSettings()
    {
        return $this->hasMany(PracticeSetting::class);
    }
}
