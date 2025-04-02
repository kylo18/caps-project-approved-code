<?php

namespace app\Models\Modules\Campuses\Models;

use Illuminate\Database\Eloquent\Model;
use Modules\Users\Models\User;

class Campus extends Model
{
    protected $table = 'campuses';
    protected $primaryKey = 'campusID';

    protected $fillable = ['campusName'];

    public function users()
    {
        return $this->hasMany(\App\Models\Modules\Users\Models\User::class, 'campusID');
    }
}
