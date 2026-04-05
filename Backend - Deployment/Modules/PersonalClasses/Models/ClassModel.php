<?php

namespace Modules\PersonalClasses\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Modules\Users\Models\User;
use Modules\Subjects\Models\Subject;

class ClassModel extends Model
{
    use HasFactory;

    protected $table = 'classes';
    protected $primaryKey = 'classID';

    protected $fillable = [
        'facultyID',
        'subjectID',
        'className',
        'classCode',
        'inviteToken',
        'inviteLink',
        'description',
        'schedule',
        'isActive',
    ];

    protected $casts = [
        'isActive' => 'boolean',
    ];

    /**
     * Relationship: Class belongs to Faculty (User)
     */
    public function faculty()
    {
        return $this->belongsTo(User::class, 'facultyID', 'userID');
    }

    /**
     * Relationship: Class belongs to Subject
     */
    public function subject()
    {
        return $this->belongsTo(Subject::class, 'subjectID', 'subjectID');
    }

    /**
     * Relationship: Class has many Enrollments
     */
    public function enrollments()
    {
        return $this->hasMany(ClassEnrollment::class, 'classID', 'classID');
    }

    /**
     * Relationship: Class has many Students through Enrollments
     */
    public function students()
    {
        return $this->belongsToMany(User::class, 'class_enrollments', 'classID', 'studentID', 'classID', 'userID')
            ->withPivot('enrolledAt')
            ->withTimestamps();
    }

    /**
     * Relationship: Class has many Personal Quizzes
     */
    public function personalQuizzes()
    {
        return $this->belongsToMany(
            \Modules\PersonalExams\Models\PersonalQuiz::class,
            'class_personal_quizzes',
            'classID',
            'personalQuizID',
            'classID',
            'personalQuizID'
        )->withPivot('startDate', 'deadlineDate')
          ->withTimestamps();
    }

    /**
     * Relationship: Class has many Quiz Attempts
     */
    public function quizAttempts()
    {
        return $this->hasMany(ClassQuizAttempt::class, 'classID', 'classID');
    }
}


