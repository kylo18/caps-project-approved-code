<?php

namespace Modules\FacultySubjects\Models;

use Illuminate\Database\Eloquent\Model;
use Modules\Subjects\Models\Subject;
use Modules\Users\Models\User;
use Modules\PersonalExams\Models\Questionnaire;

class FacultySubject extends Model
{
    protected $table = 'faculty_subjects';
    protected $primaryKey = 'facultySubjectsID';
    protected $fillable = ['facultyID', 'subjectID'];

    public function faculty()
    {
        return $this->belongsTo(User::class, 'facultyID');
    }

    // Preferred singular relation name
    public function subject()
    {
        return $this->belongsTo(Subject::class, 'subjectID');
    }

    // Backward compatible (optional)
    public function subjects()
    {
        return $this->belongsTo(Subject::class, 'subjectID');
    }

    public function questionnaires()
    {
        return $this->hasMany(Questionnaire::class, 'facultySubjectsID');
    }
}
