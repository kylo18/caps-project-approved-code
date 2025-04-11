<?php

namespace app\Models\Modules\Subjects\Models;

use Illuminate\Database\Eloquent\Model;
use app\Models\Modules\Questions\Models\Question;

class Subject extends Model
{
    protected $table = 'subjects';
    protected $primaryKey = 'subjectID';

    protected $fillable = [
        'subjectCode',
        'subjectName'
    ];

    public function faculty()
    {
        return $this->belongsToMany(\App\Models\Modules\Users\Models\User::class, 'faculty_subjects', 'subjectID', 'facultyID');
    }

    public function questions()
    {
        return $this->hasMany(Question::class, 'subjectID');
    }
}
