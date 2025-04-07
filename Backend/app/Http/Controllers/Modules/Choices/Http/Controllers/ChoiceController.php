<?php

namespace App\Http\Controllers\Modules\Choices\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Modules\Choices\Models\Choice;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use App\Models\Modules\Questions\Models\Question;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Crypt;

class ChoiceController extends Controller
{
    // List choices
    public function store(Request $request)
    {
        $user = Auth::user();

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

                if (isset($choiceData['image'])) {
                    if (filter_var($choiceData['image'], FILTER_VALIDATE_URL)) {
                        $imagePath = $choiceData['image'];
                    } elseif ($request->hasFile("choices.$index.image")) {
                        $storedPath = $request->file("choices.$index.image")->store('choices', 'public');
                        $imagePath = asset('storage/' . $storedPath);
                    }
                }

                // Encrypt the choiceText before saving it to the database
                $encryptedChoiceText = $choiceData['choiceText'] ? Crypt::encryptString($choiceData['choiceText']) : null;

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

    // Show a specific choice
    public function show($id)
    {
        $choice = Choice::find($id);

        if (!$choice) {
            return response()->json(['message' => 'Choice not found.'], 404);
        }

        // Decrypt the choiceText if it's not null
        if ($choice->choiceText) {
            try {
                $choice->choiceText = Crypt::decryptString($choice->choiceText);
            } catch (\Exception $e) {
                return response()->json(['message' => 'Decryption failed.', 'error' => $e->getMessage()], 500);
            }
        }

        // Ensure image is returned as full URL if it exists
        if ($choice->image) {
            $choice->image = url("storage/{$choice->image}");
        }

        return response()->json($choice);
    }

    // Update a choice
    public function update(Request $request, $id)
    {
        $choice = Choice::find($id);

        if (!$choice) {
            return response()->json(['message' => 'Choice not found.'], 404);
        }

        $validated = $request->validate([
            'choiceText' => 'nullable|string',
            'isCorrect' => 'nullable|boolean',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        // Handle image upload
        if ($request->hasFile('image')) {
            // Delete old image if exists
            if ($choice->image && Storage::disk('public')->exists($choice->image)) {
                Storage::disk('public')->delete($choice->image);
            }

            $validated['image'] = $request->file('image')->store('choices', 'public');
        }

        $choice->update($validated);

        return response()->json([
            'message' => 'Choice updated successfully.',
            'choice' => $choice
        ]);
    }

    // Delete a choice
    public function destroy($id)
    {
        $choice = Choice::find($id);

        if (!$choice) {
            return response()->json(['message' => 'Choice not found.'], 404);
        }

        // Delete image if exists
        if ($choice->image && Storage::disk('public')->exists($choice->image)) {
            Storage::disk('public')->delete($choice->image);
        }

        $choice->delete();

        return response()->json(['message' => 'Choice deleted successfully.']);
    }
}
