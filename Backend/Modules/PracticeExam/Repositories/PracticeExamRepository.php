<?php

namespace Modules\PracticeExam\Repositories;

use app\Models\Modules\PracticeExam\Models\PracticeExam;
use Modules\PracticeExam\Models\PracticeSetting;

class PracticeExamRepository
{
    public function create(array $data): PracticeExam
    {
        return PracticeExam::create($data);
    }

    public function addQuestions(PracticeExam $exam, array $questionIds)
    {
        return $exam->questions()->sync($questionIds);
    }

    public function savePracticeSettings(array $data): PracticeSetting
    {
        return PracticeSetting::create($data);
    }

    public function findById($id): ?PracticeExam
    {
        return PracticeExam::with(['questions', 'practiceSettings'])->where('id', $id)->first();
    }
}
