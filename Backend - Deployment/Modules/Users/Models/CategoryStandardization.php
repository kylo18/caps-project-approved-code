<?php

namespace Modules\Users\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CategoryStandardization extends Model
{
    protected $table = 'category_normalization';
    
    protected $fillable = [
        'normalized_name',
        'description',
        'priority',
    ];

    protected $casts = [
        'priority' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the variants for this category.
     */
    public function variants(): HasMany
    {
        return $this->hasMany(CategoryVariant::class);
    }
}
