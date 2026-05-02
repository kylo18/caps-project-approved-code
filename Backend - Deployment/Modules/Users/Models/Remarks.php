<?php

namespace Modules\Users\Models;

use Illuminate\Database\Eloquent\Model;
 
class Remarks extends Model
{
    protected $table = 'remarks';
    protected $fillable = ['remarksType'];
} 