<?php

namespace app\Http\Controllers\Modules\PracticeExam\Http\Controllers;

use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Modules\PracticeExam\Services\PracticeExamService;
use Illuminate\Support\Facades\Auth;

class PracticeExamController extends Controller
{
    protected $service;

    public function __construct(PracticeExamService $service)
    {
        $this->service = $service;
    }

    public function store(Request $request)
    {
        $request->validate([
            'subject_id' => 'required|exists:subjects,id',
            'coverage' => 'required|in:Midterm,Finals',
            'num_items' => 'required|integer|min:1',
            'difficulty_distribution_id' => 'required|exists:difficulty_distributions,id',
            'timer_enabled' => 'required|boolean',
            'time_limit' => 'nullable|required_if:timer_enabled,true|integer|min:1',
        ]);

        $creatorId = Auth::user()->id;

        $exam = $this->service->createPracticeExam($request->all(), $creatorId);

        return response()->json([
            'message' => 'Practice Exam created successfully.',
            'exam' => $exam
        ]);
    }
}
