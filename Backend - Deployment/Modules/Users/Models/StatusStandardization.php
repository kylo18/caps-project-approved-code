<?php

namespace Modules\Users\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class StatusNormalization extends Model
{
    protected $table = 'status_normalization';
    
    protected $fillable = [
        'normalized_name',
        'description',
        'is_default',
    ];

    protected $casts = [
        'is_default' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the variants for this status.
     */
    public function variants(): HasMany
    {
        return $this->hasMany(StatusVariant::class);
    }
}
