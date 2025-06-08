<?php

namespace Modules\Questions\Models;

use Illuminate\Database\Eloquent\Model;
use Modules\Questions\Models\Question;
use Modules\Users\Models\User;

class Status extends Model
{
    protected $fillable = ['name'];

    /**
     * Get the questions with this status.
     */
    public function questions()
    {
        return $this->hasMany(Question::class);
    }

    /**
     * Get the users with this status.
     */
    public function users()
    {
        return $this->hasMany(User::class, 'status_id');
    }

    /**
     * Check if this status is pending
     */
    public function isPending(): bool
    {
        return $this->name === 'pending';
    }

    /**
     * Check if this status is registered
     */
    public function isRegistered(): bool
    {
        return $this->name === 'registered';
    }

    /**
     * Check if this status is disapproved
     */
    public function isDisapproved(): bool
    {
        return $this->name === 'disapproved';
    }
}
