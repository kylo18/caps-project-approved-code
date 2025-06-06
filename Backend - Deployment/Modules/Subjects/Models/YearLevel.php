<?php

namespace Modules\Subjects\Models;

use Illuminate\Database\Eloquent\Model;

class YearLevel extends Model
{
    protected $table = 'year_levels';
    protected $primaryKey = 'yearLevelID';

    protected $fillable = [
        'name'
    ];

    public function subjects()
    {
        return $this->hasMany(Subject::class, 'yearLevelID');
    }
} 