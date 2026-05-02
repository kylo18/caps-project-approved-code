<?php

namespace Modules\Users\Models;

use Illuminate\Database\Eloquent\Model;
 
class Curriculum extends Model
{
    protected $table = 'curriculum';
    protected $fillable = ['curriculumType'];
} 