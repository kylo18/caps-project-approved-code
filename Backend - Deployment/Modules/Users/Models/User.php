<?php

namespace Modules\Users\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Modules\Subjects\Models\Subject;
use Illuminate\Auth\Passwords\CanResetPassword;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Laravel\Sanctum\HasApiTokens;
use Modules\Users\Models\Role;
use Modules\Questions\Models\Status;
use Modules\FacultySubjects\Models\FacultySubject;
use Modules\PracticeExams\Models\PracticeExamResult;
use Illuminate\Support\Facades\Notification;
use Illuminate\Auth\Notifications\ResetPassword;
use App\Notifications\CustomResetPassword;

class User extends Authenticatable
{
    use HasApiTokens;
    use HasFactory;
    use Notifiable;
    use CanResetPassword;


    protected $table = 'users';
    protected $primaryKey = 'userID';
    public $timestamps = true;

    protected $fillable = [
        'userCode',
        'firstName',
        'lastName',
        'email',
        'password',
        'roleID',
        'campusID',
        'isActive',
        'status_id',
        'programID',
        'google_id',

        'facebook_id',

        'email_verified_at',

    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'isActive' => 'boolean',
    ];

    // 🔹 Relationship: User belongs to a role
    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class, 'roleID');
    }

    // 🔹 Relationship: User belongs to a campus
    public function campus(): BelongsTo
    {
        return $this->belongsTo(Campus::class, 'campusID');
    }

    // 🔹 Relationship: User belongs to a status
    public function status(): BelongsTo
    {
        return $this->belongsTo(Status::class, 'status_id');
    }

    // 🔹 Relationship: User (faculty) has many assigned subjects
    public function facultySubjects(): HasMany
    {
        return $this->hasMany(FacultySubject::class, 'facultyID');
    }

    // 🔹 Relationship: User may have a student profile
    public function student(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(Student::class, 'userCode', 'userCode');
    }

    // 🔹 Check if the user is a Dean
    public function isDean(): bool
    {
        return in_array($this->roleID, [4, 5]); // Dean (4) or Associate Dean (5)
    }

    public function subjects()
    {
        return $this->belongsToMany(Subject::class, 'faculty_subjects', 'facultyID', 'subjectID');
    }

    // 🔹 Check if user is registered
    public function isRegistered(): bool
    {
        return $this->status->name === 'registered';
    }

    // 🔹 Check if user is disapproved
    public function isDisapproved(): bool
    {
        return $this->status->name === 'disapproved';
    }

    // 🔹 Check if user is pending
    public function isPending(): bool
    {
        return $this->status->name === 'pending';
    }

    public function program()
    {
        return $this->belongsTo(Program::class, 'programID', 'programID');
    }

    public function practiceExamResults()
    {
        return $this->hasMany(PracticeExamResult::class, 'userID', 'userID');
    }

    public function sendPasswordResetNotification($token)
    {
        $url = url('/password/reset/' . $token);
        $this->notifyNow(new CustomResetPassword($token, $url));
    }

    public function sendUserCodeResetNotification(string $token): void
    {
        $this->notifyNow(new CustomResetUserCode($token));
    }
}
