<?php

namespace Modules\Users\Models;

use Illuminate\Database\Eloquent\Model;

class Role extends Model
{
    protected $table = 'roles';
    protected $primaryKey = 'roleID';

    protected $fillable = ['roleName'];

    public function users()
    {
        return $this->hasMany(User::class, 'roleID');
    }
}
