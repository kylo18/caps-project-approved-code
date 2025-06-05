<?php

namespace Modules\Questions\Models;

use Illuminate\Database\Eloquent\Model;
use Modules\Questions\Models\Question;

class Difficulty extends Model
{
    protected $fillable = ['name'];

    public function questions()
    {
        return $this->hasMany(Question::class);
    }
}
