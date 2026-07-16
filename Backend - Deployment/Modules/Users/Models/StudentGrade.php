<?php

namespace Modules\Users\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentGrade extends Model
{
    protected $table = 'student_grades';

    // Denormalized text columns removed — use FK references instead
    protected $fillable = [
        'user_id',
        'student_id',
        'subject_id',
        'curriculum_id',
        'subjectDesc',
        'genAve',
        'reEx',
        'finalGrade',
    ];

    protected $casts = [
        'genAve' => 'decimal:2',
        'reEx' => 'decimal:2',
        'finalGrade' => 'decimal:2',
    ];

    /** User reference via FK */
    public function user(): BelongsTo
    {
        return $this->belongsTo(\Modules\Users\Models\User::class, 'user_id', 'userID');
    }

    /** Student record via FK */
    public function student(): BelongsTo
    {
        return $this->belongsTo(\Modules\Users\Models\Student::class, 'student_id');
    }

    /** Subject via FK */
    public function subject(): BelongsTo
    {
        return $this->belongsTo(\Modules\Subjects\Models\Subject::class, 'subject_id', 'subjectID');
    }

    /** Curriculum via FK */
    public function curriculum(): BelongsTo
    {
        return $this->belongsTo(\Modules\Users\Models\Curriculum::class, 'curriculum_id');
    }
}