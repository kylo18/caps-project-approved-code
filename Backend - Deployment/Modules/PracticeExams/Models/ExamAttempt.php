<?php

namespace Modules\PracticeExams\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Modules\Subjects\Models\Subject;
use Modules\Users\Models\User;

/**
 * Server-authoritative record of a single exam sitting.
 *
 * The presence of this row — not the client payload — defines which questions
 * were issued, when the attempt expires, and whether it has already been
 * submitted. Grading recomputes scores from the database against question_ids.
 */
class ExamAttempt extends Model
{
    use HasUuids;

    protected $table = 'exam_attempts';

    // UUID string primary key (non-incrementing).
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'userID',
        'subjectID',
        'teacher_id',
        'type',
        'question_ids',
        'answers',
        'total_points',
        'started_at',
        'expires_at',
        'submitted_at',
    ];

    protected $casts = [
        'question_ids' => 'array',
        'answers'      => 'array',
        'total_points' => 'integer',
        'started_at'   => 'datetime',
        'expires_at'   => 'datetime',
        'submitted_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'userID', 'userID');
    }

    public function subject()
    {
        return $this->belongsTo(Subject::class, 'subjectID', 'subjectID');
    }

    /**
     * Whether this attempt has already been graded/submitted.
     */
    public function isSubmitted(): bool
    {
        return $this->submitted_at !== null;
    }

    /**
     * Whether the allowed time window has elapsed.
     *
     * @param int $graceSeconds network/clock grace window
     */
    public function isExpired(int $graceSeconds = 120): bool
    {
        if ($this->expires_at === null) {
            return false; // untimed exam
        }

        return now()->greaterThan($this->expires_at->copy()->addSeconds($graceSeconds));
    }
}
