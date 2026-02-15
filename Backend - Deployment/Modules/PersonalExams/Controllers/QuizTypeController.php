<?php

namespace Modules\PersonalExams\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Modules\PersonalExams\Models\QuizType;

class QuizTypeController extends Controller
{
    public function index()
    {
        return response()->json([
            'quiz_types' => QuizType::all(),
        ]);
    }

    public function show($id)
    {
        $quizType = QuizType::with('personalQuizzes')->findOrFail($id);

        return response()->json([
            'quiz_type' => $quizType,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:quiz_types,name',
            'description' => 'nullable|string',
        ]);

        $quizType = QuizType::create($validated);

        return response()->json([
            'message' => 'Quiz type created successfully.',
            'quiz_type' => $quizType,
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $quizType = QuizType::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255|unique:quiz_types,name,' . $quizType->id,
            'description' => 'nullable|string',
        ]);

        $quizType->update($validated);

        return response()->json([
            'message' => 'Quiz type updated successfully.',
            'quiz_type' => $quizType,
        ]);
    }

    public function destroy($id)
    {
        $quizType = QuizType::findOrFail($id);
        $quizType->delete();

        return response()->json([
            'message' => 'Quiz type deleted successfully.',
        ]);
    }
}

