<?php

namespace Modules\Users\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class IssueTypeVariant extends Model
{
    protected $fillable = [
        'issue_type_id',
        'variant',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the issue type that owns the variant.
     */
    public function issueType(): BelongsTo
    {
        return $this->belongsTo(IssueType::class);
    }
}
