<?php

namespace Modules\Print\Controllers;

use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Log;
use Modules\Questions\Models\Question;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Modules\Subjects\Models\Subject;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use Barryvdh\DomPDF\Facade\Pdf;
use Modules\Users\Models\User;

class PrintController extends Controller
{
    private function generateUrl($path)
    {
        return $path ? url('storage/' . ltrim($path, '/')) : null;
    }

    public function generatePrintableExam(Request $request, $subjectID)
    {
        try {
            $user = Auth::user();
            if (!in_array($user->roleID, [2, 3, 4])) {
                return response()->json(['message' => 'Unauthorized.'], 403);
            }

            $subject = Subject::find($subjectID);
            if (!$subject) {
                return response()->json(['message' => 'Subject not found.'], 404);
            }

            $coverage = $request->input('coverage', 'full');
            $limit = (int) $request->input('limit', 10);
            $easy = (int) $request->input('easy_percentage', 30);
            $moderate = (int) $request->input('moderate_percentage', 50);
            $hard = 100 - ($easy + $moderate);

            if ($limit <= 0) {
                return response()->json(['message' => 'Item count must be greater than 0.'], 422);
            }

            $baseQuery = Question::with('choices')
                ->where('subjectID', $subjectID)
                ->where('status', 'approved')
                ->where('purpose', 'examQuestions');

            if (in_array($coverage, ['midterm', 'final'])) {
                $baseQuery->where('coverage', $coverage);
            }

            if ($user->roleID === 2) {
                $assignedSubjectIDs = $user->subjects()->pluck('subjects.subjectID')->toArray();
                if (!in_array($subjectID, $assignedSubjectIDs)) {
                    return response()->json(['message' => 'You are not assigned to this subject.'], 403);
                }
                $baseQuery->where('userID', $user->userID);
            } elseif ($user->roleID === 3) {
                $validUserIDs = User::whereIn('programID', [$user->programID, 6])->pluck('userID');
                $baseQuery->whereIn('userID', $validUserIDs);
            }

            $allQuestions = $baseQuery->get();
            if ($allQuestions->isEmpty()) {
                return response()->json(['message' => 'No questions available.'], 404);
            }

            $easyQuestions = $allQuestions->where('difficulty', 'easy')->shuffle();
            $moderateQuestions = $allQuestions->where('difficulty', 'moderate')->shuffle();
            $hardQuestions = $allQuestions->where('difficulty', 'hard')->shuffle();

            $numEasy = round($limit * ($easy / 100));
            $numModerate = round($limit * ($moderate / 100));
            $numHard = $limit - ($numEasy + $numModerate);

            $finalQuestions = collect()
                ->merge($easyQuestions->take($numEasy))
                ->merge($moderateQuestions->take($numModerate))
                ->merge($hardQuestions->take($numHard))
                ->shuffle();

            $formattedQuestions = [];

            foreach ($finalQuestions as $q) {
                try {
                    $questionText = Crypt::decryptString($q->questionText);
                } catch (\Exception $e) {
                    Log::error("Decrypt fail Q{$q->questionID}: {$e->getMessage()}");
                    continue;
                }

                $shuffledChoices = $q->choices->shuffle();
                $correctChoice = $shuffledChoices->firstWhere('isCorrect', true);

                if (!$correctChoice) {
                    continue; // Skip if no correct choice exists
                }

                $selectedChoices = collect([$correctChoice]);
                $otherChoices = $shuffledChoices->filter(fn($c) => $c->choiceID !== $correctChoice->choiceID)->take(3);
                $selectedChoices = $selectedChoices->merge($otherChoices)->shuffle();

                $choices = $selectedChoices->map(function ($choice) {
                    try {
                        $text = $choice->choiceText ? Crypt::decryptString($choice->choiceText) : null;
                    } catch (\Exception $e) {
                        $text = null;
                    }
                    return [
                        'choiceText' => $text,
                        'choiceImage' => $this->generateUrl($choice->image),
                    ];
                });

                $formattedQuestions[] = [
                    'questionText' => $questionText,
                    'questionImage' => $this->generateUrl($q->image),
                    'choices' => $choices,
                    'score' => $q->score,
                ];
            }

            if (empty($formattedQuestions)) {
                return response()->json(['message' => 'Failed to retrieve valid questions.'], 422);
            }
            $formattedQuestions = array_values($formattedQuestions);
            $pdf = PDF::loadView('exams.printable', [
                'formattedQuestions' => $formattedQuestions,
                'subjectName' => $subject->subjectName,
            ]);

            $pdf->setOptions([
                'isRemoteEnabled' => true,
            ]);
            return $pdf->download("exam_{$subject->subjectCode}.pdf");
        } catch (\Exception $e) {
            Log::error('Exam Print Error: ' . $e->getMessage());
            return response()->json(['message' => 'Server error.', 'error' => $e->getMessage()], 500);
        }
    }
}
