<?php

namespace Modules\Users\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CategoryVariant extends Model
{
    protected $table = 'category_variants';
    
    protected $fillable = [
        'category_standardization_id',
        'variant',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the category normalization that owns the variant.
     */
    public function categoryNormalization(): BelongsTo
    {
        return $this->belongsTo(CategoryStandardization::class, 'category_standardization_id');
    }
}
