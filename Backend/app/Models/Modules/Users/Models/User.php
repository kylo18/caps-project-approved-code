<?php

namespace App\Models\Modules\Users\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use App\Models\Modules\Subjects\Models\Subject;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use App\Models\Modules\Roles\Models\Role;

class User extends Authenticatable
{
    use HasApiTokens;
    use HasFactory;
    use Notifiable;


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
        'status',
        'programID',
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
        return $this->belongsTo(\app\Models\Modules\Campuses\Models\Campus::class, 'campusID');
    }

    // 🔹 Relationship: User (faculty) has many assigned subjects
    public function facultySubjects(): HasMany
    {
        return $this->hasMany(\Modules\FacultySubjects\Models\FacultySubject::class, 'facultyID');
    }

    // 🔹 Check if the user is a Dean
    public function isDean(): bool
    {
        return $this->roleID === 4;
    }

    public function subjects(): BelongsToMany
    {
        return $this->belongsToMany(Subject::class, 'faculty_subjects', 'facultyID', 'subjectID');
    }

    // 🔹 Check if user is registered
    public function isRegistered(): bool
    {
        return $this->status === 'registered';
    }

    // 🔹 Check if user is unregistered
    public function isUnregistered(): bool
    {
        return $this->status === 'unregistered';
    }

    // 🔹 Check if user is pending
    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    public function program()
    {
        return $this->belongsTo(Program::class, 'programID', 'programID');
    }
}
