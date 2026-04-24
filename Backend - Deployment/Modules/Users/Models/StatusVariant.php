<?php

namespace Modules\Users\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StatusVariant extends Model
{
    protected $table = 'status_variants';
    
    protected $fillable = [
        'status_normalization_id',
        'variant',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the status normalization that owns the variant.
     */
    public function statusNormalization(): BelongsTo
    {
        return $this->belongsTo(StatusStandardization::class);
    }
}
