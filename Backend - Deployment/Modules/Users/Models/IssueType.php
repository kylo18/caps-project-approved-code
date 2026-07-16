<?php

namespace Modules\Users\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class IssueType extends Model
{
    protected $fillable = [
        'name',
        'description',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the variants for this issue type.
     */
    public function variants(): HasMany
    {
        return $this->hasMany(IssueTypeVariant::class);
    }

    /**
     * Get the sub-options for this issue type.
     */
    public function subOptions(): HasMany
    {
        return $this->hasMany(SubOption::class);
    }

    /**
     * Get subjects that can have this issue type.
     */
    public function subjectNormalizations(): HasMany
    {
        return $this->hasMany(SubjectIssueType::class);
    }

    /**
     * Scope to get only active issue types.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
