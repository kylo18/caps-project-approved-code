<?php

namespace App\Models\Modules\Users\Models;

use Illuminate\Database\Eloquent\Model;

class Program extends Model
{
    protected $primaryKey = 'programID';

    public function users()
    {
        return $this->hasMany(User::class, 'programID', 'programID');
    }
}
