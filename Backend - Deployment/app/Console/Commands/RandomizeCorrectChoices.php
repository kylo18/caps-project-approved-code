<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Modules\Questions\Models\Question;
use Modules\Choices\Models\Choice;

class RandomizeCorrectChoices extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'choices:randomize-correct';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Randomly change the correct answer for each question to another choice.';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $questions = Question::with('choices')->get();
        $updated = 0;
        foreach ($questions as $question) {
            $choices = $question->choices;
            if ($choices->count() < 2) {
                $this->warn("Question ID {$question->questionID} has less than 2 choices. Skipping.");
                continue;
            }
            $currentCorrect = $choices->firstWhere('isCorrect', true);
            if (!$currentCorrect) {
                $this->warn("Question ID {$question->questionID} has no correct choice. Skipping.");
                continue;
            }
            $otherChoices = $choices->where('choiceID', '!=', $currentCorrect->choiceID)->values();
            $newCorrect = $otherChoices->random();
            // Update choices
            foreach ($choices as $choice) {
                $choice->isCorrect = ($choice->choiceID === $newCorrect->choiceID);
                $choice->save();
            }
            $updated++;
            $this->info("Question ID {$question->questionID}: Correct answer moved from Choice ID {$currentCorrect->choiceID} to Choice ID {$newCorrect->choiceID}.");
        }
        $this->info("Done. Updated correct answers for {$updated} questions.");
    }
} 