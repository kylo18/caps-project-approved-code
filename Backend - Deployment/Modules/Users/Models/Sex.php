<?php

namespace Modules\Users\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Sex extends Model
{
    protected $fillable = ['name'];

    /**
     * Get the students associated with this sex.
     */
    public function students(): HasMany
    {
        return $this->hasMany(Student::class, 'sex_id');
    }
} 