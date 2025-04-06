<?php

namespace Modules\Notifications\Models;

use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    protected $table = 'notifications';
    protected $primaryKey = 'notificationID';
    protected $fillable = ['userCode', 'message', 'type', 'isRead', 'sentAt'];

    public function user()
    {
        return $this->belongsTo(\App\Models\Modules\Users\Models\User::class, 'userCode');
    }
}
