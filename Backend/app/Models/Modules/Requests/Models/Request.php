<?php

namespace Modules\Requests\Models;

use Illuminate\Database\Eloquent\Model;
use Modules\Questionnaires\Models\Questionnaire;

class Request extends Model
{
    protected $table = 'requests';
    protected $primaryKey = 'requestID';
    protected $fillable = ['userCode', 'questionnaireID'];

    public function user()
    {
        return $this->belongsTo(\App\Models\Modules\Users\Models\User::class, 'userCode');
    }

    public function questionnaire()
    {
        return $this->belongsTo(Questionnaire::class, 'questionnaireID');
    }
}
