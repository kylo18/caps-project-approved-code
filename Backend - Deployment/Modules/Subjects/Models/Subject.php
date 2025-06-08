<?php

namespace Modules\Subjects\Models;

use Illuminate\Database\Eloquent\Model;
use Modules\Questions\Models\Question;
use Modules\Users\Models\User;
use Modules\PracticeExams\Models\PracticeExamSetting;
use Modules\Users\Models\Program;
use Modules\PracticeExams\Models\PracticeExamResult;
use Modules\Subjects\Models\YearLevel;

class Subject extends Model
{
    protected $table = 'subjects';
    protected $primaryKey = 'subjectID'; 
    protected $fillable = [
        'programID',
        'subjectCode',
        'subjectName', 
        'yearLevelID'
    ];

    public function faculty()
    {
        return $this->belongsToMany(User::class, 'faculty_subjects', 'subjectID', 'facultyID');
    }

    public function questions()
    {
        return $this->hasMany(Question::class, 'subjectID');
    }

    public function practiceExamSetting()
    {
        return $this->hasOne(PracticeExamSetting::class, 'subjectID');
    }

    public function program()
    {
        return $this->belongsTo(Program::class, 'programID');
    }

    public function yearLevel()
    {
        return $this->belongsTo(YearLevel::class, 'yearLevelID');
    }

    public function practiceExamResults()
    {
        return $this->hasMany(PracticeExamResult::class, 'subjectID');
    }
}
