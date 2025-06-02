<?php

namespace Modules\Questions\Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Arr;

class QuestionsTableSeeder extends Seeder
{
    private function generateQuestionText($subject, $index)
    {
        $templates = [
            "In the context of {subject}, what is the most appropriate approach to solve this problem?",
            "Which of the following best describes the concept of {subject}?",
            "According to {subject} principles, which statement is correct?",
            "When dealing with {subject}, what would be the expected outcome?",
            "How does {subject} relate to the following scenario?",
        ];

        return str_replace(
            '{subject}',
            $subject->subjectName,
            $templates[array_rand($templates)]
        );
    }

    private function generateChoiceText($questionIndex, $choiceIndex, $subject)
    {
        if ($choiceIndex === 4) {
            return 'None of the above';
        }

        $templates = [
            "This is a detailed explanation related to {subject}",
            "This represents a key concept in {subject}",
            "This demonstrates an important principle of {subject}",
            "This illustrates a fundamental aspect of {subject}",
        ];

        return str_replace(
            '{subject}',
            $subject->subjectName,
            $templates[array_rand($templates)] . " (Option " . ($choiceIndex + 1) . ")"
        );
    }

    public function run(): void
    {
        $subjects = DB::table('subjects')->get();
        $coverages = DB::table('coverages')->pluck('id')->toArray();
        $difficulties = DB::table('difficulties')->pluck('id')->toArray();
        $purposes = DB::table('purposes')->pluck('id')->toArray();
        $statuses = DB::table('statuses')->pluck('id')->toArray();
        
        // Get a default user ID for the seeder
        $defaultUser = DB::table('users')->first();
        if (!$defaultUser) {
            throw new \Exception('No users found in the database. Please seed users first.');
        }

        foreach ($subjects as $subject) {
            for ($i = 1; $i <= 50; $i++) {
                // Insert question
                $questionId = DB::table('questions')->insertGetId([
                    'subjectID' => $subject->subjectID ?? $subject->id,
                    'userID' => $defaultUser->userID ?? $defaultUser->id,
                    'questionText' => $this->generateQuestionText($subject, $i),
                    'coverage_id' => $coverages[array_rand($coverages)],
                    'difficulty_id' => $difficulties[array_rand($difficulties)],
                    'purpose_id' => $purposes[array_rand($purposes)],
                    'status_id' => $statuses[array_rand($statuses)],
                    'score' => rand(1, 5), // Adding a random score between 1 and 5
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                // Randomly select which choice will be correct (0-3, excluding "None of the above")
                $correctChoiceIndex = rand(0, 3);

                // Generate 5 choices for each question (including "None of the above")
                $choices = [];
                for ($j = 0; $j < 5; $j++) {
                    $choices[] = [
                        'questionID' => $questionId,
                        'choiceText' => $this->generateChoiceText($i, $j, $subject),
                        'isCorrect' => $j === $correctChoiceIndex,
                        'position' => $j + 1,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];
                }

                // Insert choices
                DB::table('choices')->insert($choices);
            }
        }
    }
} 