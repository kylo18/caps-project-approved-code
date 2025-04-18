<?php

namespace Modules\Users\Models;

use Illuminate\Database\Eloquent\Model;
use Modules\Users\Models\User;

class Campus extends Model
{
    protected $table = 'campuses';
    protected $primaryKey = 'campusID';

    protected $fillable = ['campusName'];

    public function users()
    {
        return $this->hasMany(User::class, 'campusID');
    }
}
