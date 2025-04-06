<?php

namespace Modules\PracticeExam\Services;

use Modules\PracticeExam\Repositories\PracticeExamRepository;
use app\Models\Modules\Questions\Models\Question;
use app\Models\Modules\DifficultyDistribution\Models\DifficultyDistribution;

class PracticeExamService
{
    protected $repository;

    public function __construct(PracticeExamRepository $repository)
    {
        $this->repository = $repository;
    }

    public function createPracticeExam(array $input, $creatorId)
    {
        $distribution = DifficultyDistribution::findOrFail($input['difficulty_distribution_id']);

        $numItems = $input['num_items'];

        // Calculate number of questions per difficulty
        $easyCount = floor($numItems * ($distribution->easy_percentage / 100));
        $moderateCount = floor($numItems * ($distribution->moderate_percentage / 100));
        $hardCount = $numItems - $easyCount - $moderateCount;

        // Get question IDs based on distribution
        $easyQuestions = $this->getQuestions($input['subjectID'], $input['coverage'], 'Easy', $easyCount);
        $moderateQuestions = $this->getQuestions($input['subjectID'], $input['coverage'], 'Moderate', $moderateCount);
        $hardQuestions = $this->getQuestions($input['subjectID'], $input['coverage'], 'Hard', $hardCount);

        $questions = array_merge($easyQuestions, $moderateQuestions, $hardQuestions);

        // Create the practice exam
        $exam = $this->repository->create([
            'subjectID' => $input['subjectID'],
            'createdBy' => $creatorId,
            'coverage' => $input['coverage'],
            'numItems' => $numItems,
            'difficultyDistributionID' => $distribution->id,
            'easyPercentage' => $distribution->easy_percentage,
            'moderatePercentage' => $distribution->moderate_percentage,
            'hardPercentage' => $distribution->hard_percentage,
        ]);

        // Attach questions to the exam
        $this->repository->addQuestions($exam, $questions);

        // Save practice settings (timer preference)
        $this->repository->savePracticeSettings([
            'userID' => $creatorId,
            'practice_exam_id' => $exam->id,
            'timer_enabled' => $input['timer_enabled'] ?? false,
            'time_limit' => $input['timer_enabled'] ? $input['time_limit'] : null,
        ]);

        return $exam;
    }

    protected function getQuestions($subjectId, $coverage, $difficulty, $limit)
    {
        return Question::where('subjectID', $subjectId)
            ->where('coverage', $coverage)
            ->where('difficulty', $difficulty)
            ->inRandomOrder()
            ->limit($limit)
            ->pluck('id')
            ->toArray();
    }
}
