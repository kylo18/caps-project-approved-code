<?php

namespace Modules\ExamSubjectDistribution\Models;

use Illuminate\Database\Eloquent\Model;
use Modules\ExamSettings\Models\ExamSetting;
use app\Models\Modules\Subjects\Models\Subject;

class ExamSubjectDistribution extends Model
{
    protected $table = 'exam_subject_distribution';
    protected $primaryKey = 'examSubjectDistributionID';
    protected $fillable = ['examSettingsID', 'subjectCode', 'percentage'];

    public function examSetting()
    {
        return $this->belongsTo(ExamSetting::class, 'examSettingsID');
    }

    public function subject()
    {
        return $this->belongsTo(Subject::class, 'subjectCode');
    }
}
