<?php

namespace App\Http\Controllers\Modules\DifficultyDistribution\Http\Controllers;

use App\Http\Controllers\Controller;
use app\Models\Modules\PracticeExam\Models\PracticeExam;
use app\Models\Modules\DifficultyDistribution\Models\DifficultyDistribution;
use Illuminate\Http\Request;
use app\Models\Modules\Questions\Models\Question;

class DifficultyDistributionController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'subject_id' => 'required|exists:subjects,id',
            'coverage' => 'required|in:midterm,finals',
            'distribution_id' => 'required|exists:difficulty_distributions,id',
            'num_items' => 'required|integer|min:1'
        ]);

        $distribution = DifficultyDistribution::findOrFail($request->distribution_id);

        $easyCount = floor($request->num_items * ($distribution->easy_percentage / 100));
        $moderateCount = floor($request->num_items * ($distribution->moderate_percentage / 100));
        $hardCount = $request->num_items - $easyCount - $moderateCount;

        DB::transaction ( function () use ($request, $distribution, $easyCount, $moderateCount, $hardCount) {

            $practiceExam = PracticeExam::create([
                'subject_id' => $request->subject_id,
                'coverage' => $request->coverage,
                'num_items' => $request->num_items,
                'difficulty_distribution_id' => $distribution->id,
                'created_by' => auth()->user()->id,
            ]);

            $questions = collect([]);

            $questions = $questions->merge(
                Question::where('subject_id', $request->subject_id)
                    ->where('coverage', $request->coverage)
                    ->where('difficulty', 'easy')
                    ->inRandomOrder()
                    ->take($easyCount)
                    ->get()
            );

            $questions = $questions->merge(
                Question::where('subject_id', $request->subject_id)
                    ->where('coverage', $request->coverage)
                    ->where('difficulty', 'moderate')
                    ->inRandomOrder()
                    ->take($moderateCount)
                    ->get()
            );

            $questions = $questions->merge(
                Question::where('subject_id', $request->subject_id)
                    ->where('coverage', $request->coverage)
                    ->where('difficulty', 'hard')
                    ->inRandomOrder()
                    ->take($hardCount)
                    ->get()
            );

            foreach ($questions as $index => $question) {
                PracticeExamQuestion::create([
                    'practice_exam_id' => $practiceExam->id,
                    'question_id' => $question->id,
                    'assigned_difficulty' => $question->difficulty,
                    'order_no' => $index + 1
                ]);
            }

        });

        return response()->json(['message' => 'Practice Exam Created Successfully'], 201);
    }

}
