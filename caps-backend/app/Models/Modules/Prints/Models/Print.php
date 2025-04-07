<?php

namespace Modules\Prints\Models;

use Illuminate\Database\Eloquent\Model;
use Modules\Questionnaires\Models\Questionnaire;

class PrintPermission extends Model
{
    protected $table = 'print_permissions';
    protected $primaryKey = 'printPermissionID';
    protected $fillable = ['requestedBy', 'approvedBy', 'status', 'notes'];

    public function requester()
    {
        return $this->belongsTo(\App\Models\Modules\Users\Models\User::class, 'requestedBy');
    }

    public function approver()
    {
        return $this->belongsTo(\App\Models\Modules\Users\Models\User::class, 'approvedBy');
    }
}
