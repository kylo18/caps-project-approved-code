<?php

namespace Modules\Choices\Controllers;

use Illuminate\Routing\Controller;
use Modules\Choices\Models\Choice;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Log;

class ChoiceController extends Controller
{
    /**
     * Store 6 choices for a specific question.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request)
    {
        $user = Auth::user();

        // Only Instructor, Program Chair, Dean can add choices
        if (!in_array($user->roleID, [2, 3, 4])) {
            return response()->json([
                'message' => 'Unauthorized. You do not have permission to add choices.'
            ], 403);
        }

        $validated = $request->validate([
            'questionID' => 'required|exists:questions,questionID',
            'choices' => 'required|array|min:6|max:6',
            'choices.*.choiceText' => 'nullable|string',
            'choices.*.isCorrect'  => 'required|boolean',
            'choices.*.image'      => 'nullable',
        ]);

        DB::beginTransaction();
        try {
            $choices = [];

            foreach ($validated['choices'] as $index => $choiceData) {
                $imagePath = null;

                // Store uploaded image if provided
                if (isset($choiceData['image'])) {
                    if (filter_var($choiceData['image'], FILTER_VALIDATE_URL)) {
                        $imagePath = $choiceData['image'];
                    } elseif ($request->hasFile("choices.$index.image")) {
                        $storedPath = $request->file("choices.$index.image")->store('choices', 'public');
                        $imagePath = $storedPath;
                    }
                }

                $encryptedChoiceText = $choiceData['choiceText']
                    ? Crypt::encryptString($choiceData['choiceText'])
                    : null;

                $choice = Choice::create([
                    'questionID' => $validated['questionID'],
                    'choiceText' => $encryptedChoiceText,
                    'isCorrect'  => $choiceData['isCorrect'],
                    'image'      => $imagePath
                ]);

                $choices[] = $choice;
            }

            DB::commit();

            return response()->json([
                'message' => 'Choices created successfully.',
                'choices' => $choices
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'message' => 'Failed to create choices.',
                'error'   => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update multiple choices for a given question.
     * Accepts updates to text, correctness, and optional image.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function updateChoices(Request $request)
    {
        $user = Auth::user();

        if (!in_array($user->roleID, [2, 3, 4])) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $request->validate([
            'questionID' => 'required|exists:questions,questionID',
            'choices' => 'required|array|min:2|max:6',
            'choices.*.choiceID' => 'nullable|exists:choices,choiceID',
            'choices.*.choiceText' => 'nullable|string',
            'choices.*.isCorrect' => 'required|boolean',
            'choices.*.image' => 'nullable',
        ]);

        DB::beginTransaction();

        try {
            $questionID = $request->questionID;
            $correctCount = collect($request->choices)->where('isCorrect', true)->count();

            if ($correctCount !== 1) {
                return response()->json([
                    'message' => 'There must be exactly one correct choice.'
                ], 422);
            }

            foreach ($request->choices as $index => $choiceData) {
                $choice = isset($choiceData['choiceID'])
                    ? Choice::find($choiceData['choiceID']) ?? new Choice()
                    : new Choice();

                $choice->questionID = $questionID;

                // Encrypt text if present
                $choice->choiceText = isset($choiceData['choiceText']) && $choiceData['choiceText'] !== null
                    ? Crypt::encryptString($choiceData['choiceText'])
                    : null;

                $choice->isCorrect = $choiceData['isCorrect'] ?? false;

                // Handle image replacement
                $hasNewImage = false;
                if (isset($choiceData['image'])) {
                    if (filter_var($choiceData['image'], FILTER_VALIDATE_URL)) {
                        $choice->image = $choiceData['image'];
                        $hasNewImage = true;
                    } elseif ($request->hasFile("choices.$index.image")) {
                        $stored = $request->file("choices.$index.image")->store('choices', 'public');
                        $choice->image = $stored;
                        $hasNewImage = true;
                    }
                }

                // Clear old image if overwriting text and no new image is given
                if (!$hasNewImage && isset($choiceData['choiceText']) && $choiceData['choiceText'] !== null) {
                    $choice->image = null;
                }

                $choice->save();
            }

            // Ensure no other old choices remain marked as correct
            Choice::where('questionID', $questionID)
                ->where('isCorrect', true)
                ->whereNotIn('choiceID', array_filter(array_column($request->choices, 'choiceID')))
                ->update(['isCorrect' => false]);

            DB::commit();

            return response()->json(['message' => 'Choices updated successfully.']);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Choice update failed: " . $e->getMessage());

            return response()->json([
                'message' => 'Failed to update choices.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Show a specific choice by ID.
     *
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function show($id)
    {
        $choice = Choice::find($id);

        if (!$choice) {
            return response()->json(['message' => 'Choice not found.'], 404);
        }

        // Decrypt choice text
        if ($choice->choiceText) {
            try {
                $choice->choiceText = Crypt::decryptString($choice->choiceText);
            } catch (\Exception $e) {
                return response()->json(['message' => 'Decryption failed.', 'error' => $e->getMessage()], 500);
            }
        }

        // Convert image path to full URL
        if ($choice->image) {
            $choice->image = url("storage/{$choice->image}");
        }

        return response()->json($choice);
    }

    /**
     * Delete a choice and remove its image from storage (if exists).
     *
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy($id)
    {
        $choice = Choice::find($id);

        if (!$choice) {
            return response()->json(['message' => 'Choice not found.'], 404);
        }

        // Delete stored image if present
        if ($choice->image && Storage::disk('public')->exists($choice->image)) {
            Storage::disk('public')->delete($choice->image);
        }

        $choice->delete();

        return response()->json(['message' => 'Choice deleted successfully.']);
    }
}
