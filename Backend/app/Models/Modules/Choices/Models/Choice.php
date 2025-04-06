<?php

namespace App\Models\Modules\Choices\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

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
    ];

    public function question()
    {
        return $this->belongsTo(\App\Models\Modules\Questions\Models\Question::class, 'questionID', 'questionID');
    }

    // Optional: accessor to return the full image URL
    public function getImageUrlAttribute()
    {
        return $this->image ? asset('storage/' . $this->image) : null;
    }
}
