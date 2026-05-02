<?php

namespace Modules\Users\Models;

use Illuminate\Database\Eloquent\Model;

class StudentGrade extends Model
{
    protected $table = 'student_grades';
    protected $fillable = [
        'userCode',
        'lastName',
        'firstName',
        'middleName',
        'curriculumID',
        'yearLevel',
        'subjectCode',
        'subjectDesc',
        'genAve',
        'reEx',
        'finalGrade',
    ];
} 