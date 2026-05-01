<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class GenerateMillionSubjectsCommand extends Command
{
    protected $signature = 'data:generate-subjects
                            {--count=1000000 : Number of subjects to generate}
                            {--chunk=500 : Rows per INSERT}';

    protected $description = 'Generate 1M test subjects from 20 base templates';

    public function handle(): int
    {
        $count = (int) $this->option('count');
        $chunkSize = (int) $this->option('chunk');

        // 20 base templates from SubjectsTableSeeder.php
        $templates = [
            ['code' => 'CS101', 'name' => 'Introduction to Computer Science',       'year' => 1, 'program' => 1],
            ['code' => 'CS201', 'name' => 'Data Structures and Algorithms',        'year' => 2, 'program' => 1],
            ['code' => 'CS301', 'name' => 'Database Management Systems',            'year' => 3, 'program' => 1],
            ['code' => 'CS401', 'name' => 'Artificial Intelligence',                'year' => 4, 'program' => 1],
            ['code' => 'ABE101', 'name' => 'Introduction to Agricultural Engineering','year' => 1, 'program' => 2],
            ['code' => 'ABE201', 'name' => 'Soil Mechanics and Conservation',        'year' => 2, 'program' => 2],
            ['code' => 'ABE301', 'name' => 'Irrigation Systems Design',             'year' => 3, 'program' => 2],
            ['code' => 'ABE401', 'name' => 'Smart Farming Technologies',            'year' => 4, 'program' => 2],
            ['code' => 'CE101', 'name' => 'Engineering Drawing and Design',         'year' => 1, 'program' => 3],
            ['code' => 'CE201', 'name' => 'Structural Analysis',                    'year' => 2, 'program' => 3],
            ['code' => 'CE301', 'name' => 'Reinforced Concrete Design',              'year' => 3, 'program' => 3],
            ['code' => 'CE401', 'name' => 'Steel Design',                            'year' => 4, 'program' => 3],
            ['code' => 'ECE101', 'name' => 'Basic Electronics',                     'year' => 1, 'program' => 4],
            ['code' => 'ECE201', 'name' => 'Electronic Circuits',                     'year' => 2, 'program' => 4],
            ['code' => 'ECE301', 'name' => 'Microprocessors and Microcontrollers',   'year' => 3, 'program' => 4],
            ['code' => 'ECE401', 'name' => 'Wireless Communications',                'year' => 4, 'program' => 4],
            ['code' => 'EE101', 'name' => 'Electrical Circuits',                      'year' => 1, 'program' => 5],
            ['code' => 'EE201', 'name' => 'Electromagnetic Theory',                  'year' => 2, 'program' => 5],
            ['code' => 'EE301', 'name' => 'Power Systems Analysis',                  'year' => 3, 'program' => 5],
            ['code' => 'EE401', 'name' => 'High Voltage Engineering',                'year' => 4, 'program' => 5],
        ];

        // Check seed_progress for resume
        $progress = DB::table('seed_progress')->where('task', 'generate_subjects')->first();
        $resumeFrom = $progress ? (int) $progress->last_id : 0;

        $this->info("Generating {$count} subjects from " . count($templates) . " templates...");
        $this->info("Resume point: variant #{$resumeFrom}");

        // 50,000 variants per template = 1M total
        $variantsPerTemplate = 50000;
        $totalVariants = $count;

        $bar = $this->output->createProgressBar($count);
        $bar->start();

        $batch = [];
        $inserted = 0;
        $variantIndex = $resumeFrom;

        for ($t = 0; $t < count($templates); $t++) {
            $template = $templates[$t];
            $templateVariants = min($variantsPerTemplate, ceil($totalVariants / count($templates)));

            for ($v = 1; $v <= $variantsPerTemplate && $inserted < $count; $v++) {
                $variantIndex++;
                $seq = str_pad($v, 5, '0', STR_PAD_LEFT);

                $batch[] = [
                    'subjectCode' => "{$template['code']}_{$seq}",
                    'subjectName' => "{$template['name']} Variant {$seq}",
                    'programID' => $template['program'],
                    'yearLevelID' => $template['year'],
                    'is_enabled_for_exam_questions' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];

                $inserted++;
                $bar->advance(1);

                if (count($batch) >= $chunkSize) {
                    DB::table('subjects')->insertOrIgnore($batch);
                    $batch = [];

                    // Update checkpoint every 10 chunks
                    if ($inserted % ($chunkSize * 10) === 0) {
                        DB::table('seed_progress')->updateOrInsert(
                            ['task' => 'generate_subjects'],
                            ['last_id' => $variantIndex, 'updated_at' => now()]
                        );
                        gc_collect_cycles();
                    }
                }
            }
        }

        // Insert remaining
        if (!empty($batch)) {
            DB::table('subjects')->insertOrIgnore($batch);
        }

        $bar->finish();
        $this->newLine();

        DB::table('seed_progress')->where('task', 'generate_subjects')->delete();

        $this->info("Done! Generated {$inserted} subjects from 20 templates.");
        return 0;
    }
}