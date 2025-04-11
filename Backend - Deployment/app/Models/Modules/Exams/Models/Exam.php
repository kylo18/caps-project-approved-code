<?php

namespace Modules\Exams\Models;

use Illuminate\Database\Eloquent\Model;
use Modules\Subjects\Models\Subject;

class Exam extends Model
{
    protected $table = 'exams';
    protected $primaryKey = 'examID';
    protected $fillable = ['studentCode', 'subjectCode', 'type', 'score'];

    public function student()
    {
        return $this->belongsTo(\App\Models\Modules\Users\Models\User::class, 'studentCode');
    }

    public function subject()
    {
        return $this->belongsTo(Subject::class, 'subjectCode');
    }
}
