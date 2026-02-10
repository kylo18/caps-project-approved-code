<?php

namespace Modules\FacultySubjects\Models;

use Illuminate\Database\Eloquent\Model;
use Modules\Subjects\Models\Subject;
use Modules\Users\Models\User;

class FacultySubject extends Model
{
    protected $table = 'faculty_subjects';
    protected $primaryKey = 'facultySubjectsID';
    protected $fillable = ['facultyID', 'subjectID'];

    public function faculty()
    {
        return $this->belongsTo(User::class, 'facultyID');
    }

    public function subjects()
    {
        return $this->belongsTo(Subject::class, 'subjectID');
    }
}
