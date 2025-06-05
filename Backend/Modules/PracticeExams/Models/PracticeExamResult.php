<?php

namespace Modules\PracticeExams\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Modules\Subjects\Models\Subject;
use Modules\Users\Models\User;

class PracticeExamResult extends Model
{
    use HasFactory;

    protected $primaryKey = 'resultID';

    protected $fillable = [
        'userID',
        'subjectID',
        'totalPoints',
        'earnedPoints',
        'percentage',
    ];

    public function subject()
    {
        return $this->belongsTo(Subject::class, 'subjectID', 'subjectID');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'userID', 'userID');
    }
}
