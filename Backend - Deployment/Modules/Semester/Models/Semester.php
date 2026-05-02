<?php

namespace Modules\Semester\Models;

use Illuminate\Database\Eloquent\Model;

class Semester extends Model
{
    protected $table = 'semester';
    protected $primaryKey = 'semesterID';
    protected $fillable = ['semesterDescription'];
}