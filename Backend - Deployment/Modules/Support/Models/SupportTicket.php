<?php

namespace Modules\Support\Models;

use Illuminate\Database\Eloquent\Model;
//use Illuminate\Database\Eloquent\SoftDeletes;
use Modules\Users\Models\User;

class SupportTicket extends Model
{
   // use SoftDeletes; // 9. Soft Deletes vs Hard Deletes

    protected $fillable = [
        'user_id',
        'category',
        'subject',
        'description',
        'status',
        'priority',
    ];

    /**
     * Get the user that owns the support ticket.
     */
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'userID');
    }
}

