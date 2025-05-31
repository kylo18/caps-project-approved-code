<?php

namespace Modules\Questions\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Modules\Users\Models\User;
use Modules\Subjects\Models\Subject;
use Modules\Choices\Models\Choice;

class Question extends Model
{
    use HasFactory;

    protected $table = 'questions';
    protected $primaryKey = 'questionID';

    protected $fillable = [
        'subjectID',
        'questionText',
        'userID',
        'image',
        'score',
        'difficulty_id',
        'coverage_id',
        'status_id',
        'purpose_id',
    ];


    // No need for a cast here unless a field in your table is stored as JSON
    // protected $casts = [
    //     'choices' => 'array',
    // ];

    /**
     * Get the subject that owns the question.
     */
    public function subject()
    {
        return $this->belongsTo(Subject::class, 'subjectID');
    }

    /**
     * Get the choices for this question.
     */
    public function choices()
    {
        return $this->hasMany(Choice::class, 'questionID');
    }
    public function user()
    {
        return $this->belongsTo(User::class, 'userID');
    }

    public function purpose()
    {
        return $this->belongsTo(Purpose::class, 'purpose_id');
    }

    public function difficulty()
    {
        return $this->belongsTo(Difficulty::class, 'difficulty_id');
    }

    public function status()
    {
        return $this->belongsTo(Status::class, 'status_id');
    }

    public function coverage()
    {
        return $this->belongsTo(Coverage::class, 'coverage_id');
    }
}
