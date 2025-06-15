<?php

namespace Modules\Users\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Student extends Model
{
    protected $fillable = [
        'userCode',
        'fullName',
        'lastName',
        'firstName_middleName',
        'sex_id',
        'programID',
        'yearLevel',
        'block'
    ];

    /**
     * Get the sex of the student.
     */
    public function sex(): BelongsTo
    {
        return $this->belongsTo(Sex::class, 'sex_id');
    }

    /**
     * Get the program of the student.
     */
    public function program(): BelongsTo
    {
        return $this->belongsTo(Program::class, 'programID', 'programID');
    }

    /**
     * Get the user associated with this student.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'userCode', 'userCode');
    }
} 