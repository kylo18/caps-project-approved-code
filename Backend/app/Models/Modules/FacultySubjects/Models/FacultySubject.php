<?php

namespace Modules\FacultySubjects\Models;

use Illuminate\Database\Eloquent\Model;
use app\Models\Modules\Subjects\Models\Subject;
use app\Models\Modules\Users\Models\User;

class FacultySubject extends Model
{
    protected $table = 'faculty_subjects';
    protected $primaryKey = 'facultySubjectsID';
    protected $fillable = ['facultyCode', 'subjectCode'];

    public function faculty()
    {
        return $this->belongsTo(User::class, 'facultyID');
    }

    public function subjects()
    {
        return $this->belongsTo(Subject::class, 'subjectID');
    }
}
