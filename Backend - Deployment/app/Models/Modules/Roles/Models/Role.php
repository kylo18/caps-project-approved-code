<?php

namespace app\Models\Modules\Roles\Models;

use Illuminate\Database\Eloquent\Model;

class Role extends Model
{
    protected $table = 'roles';
    protected $primaryKey = 'roleID';

    protected $fillable = ['roleName'];

    public function users()
    {
        return $this->hasMany(\App\Models\Modules\Users\Models\User::class, 'roleID');
    }
}
