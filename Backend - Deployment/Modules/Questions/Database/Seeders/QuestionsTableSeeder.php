<?php

namespace Modules\Questions\Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Arr;

class QuestionsTableSeeder extends Seeder
{
    private function generateQuestionText($subject, $index, $purposeId)
    {
        $templates = [
            // Purpose ID 1 (Practice/Review) templates
            1 => [
                "In {subject}, explain the concept of {concept}.",
                "What is the primary function of {concept} in {subject}?",
                "How does {concept} relate to {related_concept} in {subject}?",
                "Describe the process of {concept} in the context of {subject}.",
                "What are the key components of {concept} in {subject}?",
            ],
            // Purpose ID 2 (Assessment/Exam) templates
            2 => [
                "A problem in {subject} involves {concept}. Which of the following is correct?",
                "Given a scenario in {subject} where {concept} is applied, determine the most appropriate solution.",
                "Analyze the following {subject} situation involving {concept}.",
                "In a practical application of {subject}, how would {concept} be implemented?",
                "Calculate the outcome when {concept} is applied in this {subject} problem.",
            ]
        ];

        $concepts = $this->getSubjectConcepts($subject->subjectName);
        $concept = $concepts[array_rand($concepts)];
        $related_concept = $concepts[array_rand($concepts)];

        $template = $templates[$purposeId][array_rand($templates[$purposeId])];
        $text = str_replace(
            ['{subject}', '{concept}', '{related_concept}'],
            [$subject->subjectName, $concept, $related_concept],
            $template
        );

        return Crypt::encryptString($text);
    }

    private function getSubjectConcepts($subjectName)
    {
        // Define relevant concepts for each subject area
        $concepts = [
            'Computer Science' => ['algorithms', 'data structures', 'programming paradigms', 'complexity analysis', 'software design'],
            'Agricultural Engineering' => ['irrigation systems', 'soil properties', 'farm machinery', 'crop processing', 'agricultural waste'],
            'Civil Engineering' => ['structural analysis', 'construction materials', 'foundation design', 'hydraulics', 'transportation'],
            'Electronics' => ['circuit analysis', 'digital systems', 'signal processing', 'microcontrollers', 'communication systems'],
            'Electrical' => ['power systems', 'electromagnetic fields', 'control systems', 'electrical machines', 'power electronics']
        ];

        // Extract the main subject area from the subject name
        foreach ($concepts as $area => $areaConceptList) {
            if (str_contains($subjectName, $area)) {
                return $areaConceptList;
            }
        }

        // Default concepts if no specific match is found
        return ['theory', 'application', 'analysis', 'design', 'implementation'];
    }

    private function generateChoiceText($questionIndex, $choiceIndex, $subject, $purposeId)
    {
        if ($choiceIndex === 4) {
            return Crypt::encryptString('None of the above');
        }

        $templates = [
            1 => [ // Practice/Review
                "This explains how {concept} works in {subject}",
                "This demonstrates the application of {concept} in {subject}",
                "This illustrates the relationship between {concept} and {subject}",
                "This shows the implementation of {concept} in {subject}",
            ],
            2 => [ // Assessment/Exam
                "The solution involves applying {concept} to solve the {subject} problem",
                "Using {concept} principles in {subject}, this approach works because...",
                "Based on {subject} theory, {concept} leads to this outcome",
                "Following {subject} methodology, {concept} results in this solution",
            ]
        ];

        $concepts = $this->getSubjectConcepts($subject->subjectName);
        $concept = $concepts[array_rand($concepts)];

        $template = $templates[$purposeId][array_rand($templates[$purposeId])];
        $text = str_replace(
            ['{subject}', '{concept}'],
            [$subject->subjectName, $concept],
            $template . " (Option " . ($choiceIndex + 1) . ")"
        );

        return Crypt::encryptString($text);
    }

    public function run(): void
    {
        $subjects = DB::table('subjects')->get();
        $coverages = DB::table('coverages')->pluck('id')->toArray();
        $difficulties = DB::table('difficulties')->pluck('id')->toArray();
        
        // Questions will be added by users 1-3
        $allowedUserIds = [1, 2, 3];
        
        $questionsPerType = 250; // 250 questions per type (practice and exam)
        $batchSize = 100; // Insert questions in batches for better performance

        foreach ($subjects as $subject) {
            // Generate questions for each purpose ID (1 and 2)
            for ($purposeId = 1; $purposeId <= 2; $purposeId++) {
                $questions = [];
                $choices = [];

                for ($i = 1; $i <= $questionsPerType; $i++) {
                    // Randomly select a user from allowed users
                    $userId = $allowedUserIds[array_rand($allowedUserIds)];
                    
                    // For approved questions (status_id = 2), set approvedBy to a random admin (1-3)
                    $approvedBy = $allowedUserIds[array_rand($allowedUserIds)];
                    
                    // Insert question
                    $questionId = DB::table('questions')->insertGetId([
                        'subjectID' => $subject->subjectID,
                        'userID' => $userId,
                        'questionText' => $this->generateQuestionText($subject, $i, $purposeId),
                        'image' => null,
                        'score' => rand(1, 5),
                        'purpose_id' => $purposeId,
                        'difficulty_id' => $difficulties[array_rand($difficulties)],
                        'status_id' => 2, // Always approved status
                        'coverage_id' => $coverages[array_rand($coverages)],
                        'editedBy' => null,
                        'approvedBy' => $approvedBy,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);

                    // Randomly select which choice will be correct (0-3)
                    $correctChoiceIndex = rand(0, 3);

                    // Generate 5 choices for each question
                    for ($j = 0; $j < 5; $j++) {
                        $choices[] = [
                            'questionID' => $questionId,
                            'choiceText' => $this->generateChoiceText($i, $j, $subject, $purposeId),
                            'isCorrect' => $j === $correctChoiceIndex,
                            'position' => $j + 1,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ];
                    }

                    // Insert choices in batches
                    if (count($choices) >= $batchSize * 5) {
                        DB::table('choices')->insert($choices);
                        $choices = [];
                    }
                }

                // Insert any remaining choices
                if (!empty($choices)) {
                    DB::table('choices')->insert($choices);
                }
            }
        }
    }
} 