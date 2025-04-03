<?php

namespace Modules\ExamSettings\Models;

use Illuminate\Database\Eloquent\Model;

class ExamSetting extends Model
{
    protected $table = 'exam_settings';
    protected $primaryKey = 'examSettingsID';
    protected $fillable = ['createdBy', 'examType', 'difficulty'];

    public function creator()
    {
        return $this->belongsTo(\App\Models\Modules\Users\Models\User::class, 'createdBy');
    }
}
