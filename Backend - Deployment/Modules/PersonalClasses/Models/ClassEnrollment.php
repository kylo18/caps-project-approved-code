<?php

namespace Modules\PersonalClasses\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Modules\Users\Models\User;

class ClassEnrollment extends Model
{
    use HasFactory;

    protected $table = 'class_enrollments';
    protected $primaryKey = 'enrollmentID';

    protected $fillable = [
        'classID',
        'studentID',
        'enrolledAt',
    ];

    protected $casts = [
        'enrolledAt' => 'datetime',
    ];

    /**
     * Relationship: Enrollment belongs to Class
     */
    public function class()
    {
        return $this->belongsTo(ClassModel::class, 'classID', 'classID');
    }

    /**
     * Relationship: Enrollment belongs to Student (User)
     */
    public function student()
    {
        return $this->belongsTo(User::class, 'studentID', 'userID');
    }
}

