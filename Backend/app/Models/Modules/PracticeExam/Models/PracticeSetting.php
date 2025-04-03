<?php

namespace Modules\PracticeExam\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Modules\Users\Models\User;
use app\Models\Modules\PracticeExam\Models\PracticeExam;

class PracticeSetting extends Model
{
    protected $fillable = [
        'user_id',
        'practice_exam_id',
        'timer_enabled',
        'time_limit'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function practiceExam()
    {
        return $this->belongsTo(PracticeExam::class);
    }
}
