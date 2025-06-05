<?php

namespace Modules\Users\Models;

use Illuminate\Database\Eloquent\Model;
use Modules\Subjects\Models\Subject;

class Program extends Model
{
    protected $primaryKey = 'programID';

    public function users()
    {
        return $this->hasMany(User::class, 'programID', 'programID');
    }

    public function subjects()
    {
        return $this->hasMany(Subject::class, 'programID', 'programID');
    }
}
