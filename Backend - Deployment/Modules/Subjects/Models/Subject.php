<?php

namespace Modules\Subjects\Models;

use Illuminate\Database\Eloquent\Model;
use Modules\Questions\Models\Question;
use Modules\Users\Models\User;

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
        return $this->belongsToMany(User::class, 'faculty_subjects', 'subjectID', 'facultyID');
    }

    public function questions()
    {
        return $this->hasMany(Question::class, 'subjectID');
    }
}
