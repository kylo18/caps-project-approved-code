<?php

namespace App\Http\Controllers\Modules\Questions\Http\Controllers;

use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Models\Modules\Questions\Models\Question;
use Illuminate\Support\Facades\DB;
use App\Models\Modules\Choices\Models\Choice;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Str;
use app\Models\Modules\Subjects\Models\Subject;

class QuestionController extends Controller
{
    /**
     * Store a new question with choices
     */
    public function store(Request $request)
    {
        $user = Auth::user();

        if (!in_array($user->roleID, [2, 3, 4])) {
            return response()->json([
                'message' => 'Unauthorized. You do not have permission to add questions.'
            ], 403);
        }

        $validated = $request->validate([
            'subjectID'     => 'required|exists:subjects,subjectID',
            'coverage'      => 'required|in:midterm,finals',
            'questionText'  => 'required|string',
            'image'         => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
            'score'         => 'required|integer|min:1',
            'difficulty'    => 'required|in:easy,moderate,hard',
            'status'        => 'required|in:pending,approved,disapproved',
            'purpose'       => 'required|in:examQuestions,practiceQuestions'
        ]);

        DB::beginTransaction();

        try {
            $imagePath = null;
            if ($request->hasFile('image')) {
                $imagePath = $request->file('image')->store('question_images', 'public');
                $imagePath = asset('storage/' . $imagePath);
            }

            $status = ($user->roleID === 2) ? 'pending' : 'approved';

            $encryptedQuestionText = Crypt::encryptString($validated['questionText']);

            $question = Question::create([
                'subjectID'     => $validated['subjectID'],
                'userID'        => $user->userID,
                'coverage'      => $validated['coverage'],
                'questionText'  => $encryptedQuestionText,
                'image'         => $imagePath,
                'score'         => $validated['score'],
                'difficulty'    => $validated['difficulty'],
                'status'        => $status,
                'purpose'       => $validated['purpose'],
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Question created successfully.',
                'data'    => [
                    'questionID'    => $question->questionID,
                    'subjectID'     => $question->subjectID,
                    'coverage'      => $question->coverage,
                    'questionText'  => Crypt::decryptString($question->questionText),
                    'image'         => $question->image ? asset('storage/' . $question->image) : null,
                    'score'         => $question->score,
                    'difficulty'    => $question->difficulty,
                    'status'        => $question->status,
                    'purpose'       => $question->purpose,
                ]
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to create question.',
                'error'   => $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, $questionID)
    {
        $user = Auth::user();

        if (!in_array($user->roleID, [2, 3, 4])) {
            return response()->json([
                'message' => 'Unauthorized. You do not have permission to edit questions.'
            ], 403);
        }

            $validated = $request->validate([
                'subjectID'     => 'required|exists:subjects,subjectID',
                'coverage'      => 'required|in:midterm,finals',
                'questionText'  => 'required|string',
                'image'         => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:10240',
                'score'         => 'required|integer|min:1',
                'difficulty'    => 'required|in:easy,moderate,hard',
                'choices'       => 'required|array|min:2|max:6',
                'choices.*.choiceID'   => 'nullable|exists:choices,choiceID',
                'choices.*.choiceText' => 'nullable|string',
                'choices.*.isCorrect'  => 'required|boolean',
                'choices.*.image'      => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:10240',
            ]);

        DB::beginTransaction();

        try {
            $question = Question::findOrFail($questionID);

            if ($request->hasFile('image')) {
                if ($question->image) {
                    Storage::disk('public')->delete($question->image);
                }
                $imagePath = $request->file('image')->store('questions', 'public');
                $validated['image'] = asset('storage/' . $imagePath);
            } else {
                $validated['image'] = $question->image;
            }

            $validated['status'] = ($user->roleID === 2) ? 'pending' : 'approved';

            $encryptedQuestionText = Crypt::encryptString($validated['questionText']);

            $question->update([
                'subjectID'    => $validated['subjectID'],
                'coverage'     => $validated['coverage'],
                'questionText' => $encryptedQuestionText,
                'image'        => $validated['image'],
                'score'        => $validated['score'],
                'difficulty'   => $validated['difficulty'],
                'status'       => $validated['status'],
            ]);

            foreach ($validated['choices'] as $index => $choiceData) {
                if (isset($choiceData['choiceID'])) {
                    $choice = Choice::findOrFail($choiceData['choiceID']);

                    if ($request->hasFile("choices.$index.image")) {
                        if ($choice->image) {
                            Storage::disk('public')->delete($choice->image);
                        }
                        $imagePath = $request->file("choices.$index.image")->store('choices', 'public');
                        $choiceData['image'] = asset('storage/' . $imagePath);
                    } else {
                        $choiceData['image'] = $choice->image;
                    }

                    $encryptedChoiceText = $choiceData['choiceText']
                        ? Crypt::encryptString($choiceData['choiceText'])
                        : null;

                    $choice->update([
                        'choiceText' => $encryptedChoiceText,
                        'isCorrect'  => $choiceData['isCorrect'],
                        'image'      => $choiceData['image'],
                    ]);
                } else {
                    // Create new choice
                    $imagePath = null;
                    if ($request->hasFile("choices.$index.image")) {
                        $imagePath = $request->file("choices.$index.image")->store('choices', 'public');
                        $imagePath = asset('storage/' . $imagePath); // Convert to full URL
                    }

                    // Encrypt new choice text before saving
                    $encryptedChoiceText = $choiceData['choiceText']
                        ? Crypt::encryptString($choiceData['choiceText'])
                        : null;

                    Choice::create([
                        'questionID' => $question->questionID,
                        'choiceText' => $encryptedChoiceText,
                        'isCorrect'  => $choiceData['isCorrect'],
                        'image'      => $imagePath
                    ]);
                }
            }

            DB::commit();

            return response()->json([
                'message'  => 'Question updated successfully.',
                'question' => $question->load('choices') // Include choices in response
            ], 200);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'message' => 'Failed to update question.',
                'error'   => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get all questions
     */
    public function indexQuestions($subjectID)
    {
        // Check if the subject exists
        $subject = Subject::find($subjectID);

        if (!$subject) {
            return response()->json([
                'message' => 'Subject not found.',
            ], 404);
        }

        // Retrieve questions and decrypt the questionText
        $questions = Question::with(['subject', 'choices'])
            ->where('subjectID', $subjectID)
            ->get()
            ->map(function ($question) {
                try {
                    $question->questionText = Crypt::decryptString($question->questionText);
                } catch (\Exception $e) {
                    $question->questionText = '[Decryption Error]';
                }

                // Append full image URL if an image exists
                if ($question->image && !Str::startsWith($question->image, 'http')) {
                    $question->image = url("storage/{$question->image}");
                }
                return $question;
            });

        return response()->json([
            'message' => 'Questions for subject retrieved successfully!',
            'subject' => $subject->subjectName,
            'data'    => $questions
        ], 200);
    }

    public function destroy($questionID)
    {
        $user = Auth::user();

        // Check if the question exists
        $question = Question::find($questionID);

        if (!$question) {
            return response()->json([
                'message' => 'Question not found.'
            ], 404);
        }

        // Check if the user has permission to delete the question
        if (!in_array($user->roleID, [2, 3, 4])) { // Program Chair & Associate Dean can delete
            return response()->json([
                'message' => 'Unauthorized. You do not have permission to delete this question.'
            ], 403);
        }

        // If the question has an image, delete it from storage
        if ($question->image) {
            Storage::disk('public')->delete($question->image);
        }

        // Delete the question
        $question->delete();

        return response()->json([
            'message' => 'Question deleted successfully.'
        ], 200);
    }

    public function mySubjectQuestions($subjectID)
    {
        $user = Auth::user();

        // Check if the subject exists
        $subject = Subject::find($subjectID);

        if (!$subject) {
            return response()->json([
                'message' => 'Subject not found.'
            ], 404);
        }

        // Retrieve questions for this subject created by this user
        $questions = Question::with(['subject', 'choices'])
            ->where('subjectID', $subjectID)
            ->where('userID', $user->userID)
            ->get()
            ->map(function ($question) {
                try {
                    $question->questionText = Crypt::decryptString($question->questionText);
                } catch (\Exception $e) {
                    $question->questionText = '[Decryption Error]';
                }

                // Append full image URL if an image exists
                if ($question->image && !Str::startsWith($question->image, 'http')) {
                    $question->image = url("storage/{$question->image}");
                }

                return $question;
            });

        return response()->json([
            'message' => 'Your questions for this subject retrieved successfully!',
            'subject' => $subject->subjectName,
            'data'    => $questions
        ], 200);
    }

    public function updateStatus($questionID)
    {
        $user = Auth::user();

        // Only Dean (roleID 4) and Program Chair (roleID 3) can approve questions
        if (!in_array($user->roleID, [3, 4])) {
            return response()->json([
                'message' => 'Unauthorized. Only the Dean or Program Chair can approve questions.'
            ], 403);
        }

        // Find the question
        $question = Question::find($questionID);

        if (!$question) {
            return response()->json([
                'message' => 'Question not found.'
            ], 404);
        }

        if ($question->status !== 'pending') {
            return response()->json([
                'message' => 'Only questions with pending status can be approved.',
                'current_status' => $question->status
            ], 400);
        }

        // Update the status to "approved"
        $question->status = 'approved';
        $question->save();

        return response()->json([
            'message' => 'Question approved successfully!',
            'question' => $question
        ], 200);
    }
}
