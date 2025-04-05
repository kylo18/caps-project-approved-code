<?php

namespace app\Models\Modules\DifficultyDistribution\Models;

use Illuminate\Database\Eloquent\Model;
use Modules\ExamSubjectDistribution\Models\ExamSubjectDistribution;

class DifficultyDistribution extends Model
{
    protected $table = 'difficulty_distribution';
    protected $primaryKey = 'difficultyDistributionID';
    protected $fillable = ['examSubjectDistributionID', 'easyPercentage', 'moderatePercentage', 'hardPercentage'];

    public function examSubjectDistribution()
    {
        return $this->belongsTo(ExamSubjectDistribution::class, 'examSubjectDistributionID');
    }
}
