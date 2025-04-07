<?php

namespace Modules\FacultySubjects\Models;

use Illuminate\Database\Eloquent\Model;
use app\Models\Modules\Subjects\Models\Subject;

class FacultySubject extends Model
{
    protected $table = 'faculty_subjects';
    protected $primaryKey = 'facultySubjectsID';
    protected $fillable = ['facultyCode', 'subjectCode'];

    public function faculty()
    {
        return $this->belongsTo(\App\Models\Modules\Users\Models\User::class, 'facultyID');
    }

    public function subject()
    {
        return $this->belongsTo(Subject::class, 'subjectID');
    }
}
