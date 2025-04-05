<?php

namespace App\Models\Modules\Questions\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Purpose extends Model
{
    use HasFactory;

    protected $table = 'purposes';

    protected $primaryKey = 'purposeID';

    public $timestamps = false;

    protected $fillable = [
        'purposeName',
    ];

    /**
     * A purpose has many questions.
     */
    public function questions()
    {
        return $this->hasMany(Question::class, 'purposeID', 'purposeID');
    }
}
