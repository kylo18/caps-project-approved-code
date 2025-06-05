<?php

namespace Modules\Choices\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Modules\Questions\Models\Question;

class Choice extends Model
{
    use HasFactory;

    protected $table = 'choices';
    protected $primaryKey = 'choiceID';

    protected $fillable = [
        'questionID',
        'choiceText',
        'image',
        'isCorrect',
        'position'
    ];

    protected $casts = [
        'isCorrect' => 'boolean',
    ];

    public function question()
    {
        return $this->belongsTo(Question::class, 'questionID', 'questionID');
    }

    // Optional: accessor to return the full image URL
    public function getImageUrlAttribute()
    {
        return $this->image ? asset('storage/' . $this->image) : null;
    }
}
