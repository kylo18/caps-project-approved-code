<?php
namespace Modules\Leaderboard\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Modules\Subjects\Models\Subject;
use Modules\Users\Models\User;
/**
 * Leaderboard Model
 * 
 * Represents a student's best performance record in the CAPS leaderboard system.
 * Ranking is based purely on the highest percentage ever achieved (High Score model).
 * 
 * Business Rules:
 * - A student's rank is based on their highest percentage ever achieved in an exam attempt.
 * - If a new attempt is higher than the current record, update the leaderboard.
 * - If it is lower, the record remains unchanged.
 * 
 * IMPORTANT: Uses atomic updates to prevent race conditions when multiple
 * exam submissions occur simultaneously.
 */
class Leaderboard extends Model
{
    use HasFactory;
    protected $table = 'leaderboards';
    protected $primaryKey = 'leaderboardID';
    public $timestamps = true;
    protected $fillable = [
        'userID',
        'subjectID',
        'highest_percentage',
        'total_exams',
        'score',
    ];
    protected $casts = [
        'highest_percentage' => 'float',
        'total_exams' => 'integer',
        'score' => 'float',
    ];
    /**
     * Relationship: A leaderboard record belongs to a subject.
     */
    public function subject()
    {
        return $this->belongsTo(Subject::class, 'subjectID', 'subjectID');
    }
    /**
     * Relationship: A leaderboard record belongs to a user.
     */
    public function user()
    {
        return $this->belongsTo(User::class, 'userID', 'userID');
    }
    /**
     * Update or create a leaderboard record when a student submits an exam.
     * 
     * Uses DB transaction with locking to prevent race conditions.
     * Only updates highest_percentage if new score is higher.
     * Always increments total_exams count.
     * 
     * @param int $userID The ID of the user
     * @param int $subjectID The ID of the subject
     * @param float $percentage The percentage score achieved
     * @return self The updated or created leaderboard record
     */
    public static function updateOrCreateRecord(int $userID, int $subjectID, float $percentage): self
    {
        // Use database transaction to ensure atomicity
        return DB::transaction(function () use ($userID, $subjectID, $percentage) {
            // Lock the row for update to prevent race conditions
            // This ensures only one process can update at a time
            $record = self::lockForUpdate()
                ->where('userID', $userID)
                ->where('subjectID', $subjectID)
                ->first();
            
            // If no record exists, create a new one
            if (!$record) {
                $record = new self();
                $record->userID = $userID;
                $record->subjectID = $subjectID;
                $record->highest_percentage = $percentage;
                $record->total_exams = 1;
                $record->score = $percentage;
                $record->save();
                return $record;
            }
            
            // Only update highest_percentage if new score is better
            // This maintains the "Personal Best" logic
            if ($percentage > $record->highest_percentage) {
                $record->highest_percentage = $percentage;
                $record->score = $percentage;
            }
            
            // Always increment the exam count
            $record->total_exams += 1;
            $record->save();
            
            return $record;
        });
    }
    /**
     * Recalculate all scores - kept for maintenance purposes.
     * 
     * Note: This is not called automatically anymore to improve performance.
     * Use this method only when you need to sync all scores after data fixes.
     */
    public static function recalculateAllScores(): void
    {
        $records = self::all();
        foreach ($records as $record) {
            $record->score = $record->highest_percentage;
            $record->save();
        }
    }
    /**
     * Get top records by score.
     * 
     * Supports filtering by subject and program.
     * 
     * @param int $limit Number of records to return
     * @param int|null $subjectID Optional subject filter
     * @param int|null $subjectID Optional program filter
     * @return \Illuminate\Database\Eloquent\Collection Collection of leaderboard records
     */
    public static function getTopRecords(int $limit = 10, ?int $subjectID = null, ?int $programID = null)
    {
        $query = self::with(['user.program', 'user.role']);
        
        // Apply subject filter if provided
        if ($subjectID) {
            $query->where('subjectID', $subjectID);
        }
        
        // Apply program filter via user relationship if provided
        if ($programID) {
            $query->whereHas('user', function ($q) use ($programID) {
                $q->where('programID', $programID);
            });
        }
        
        // Order by score descending (highest first) and limit results
        return $query->orderByDesc('score')
            ->limit($limit)
            ->get();
    }
}