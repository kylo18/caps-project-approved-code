<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class GenerateMillionUsersCommand extends Command
{
    protected $signature = 'data:generate-users
                            {--count=1000000 : Number of users to generate}
                            {--start=10001 : Starting number}
                            {--chunk=500 : Rows per INSERT}
                            {--year=26 : Year for userCode}
                            {--campus=A : Campus letter}';

    protected $description = 'Generate 1M test users';

    public function handle(): int
    {
        $count = (int) $this->option('count');
        $startNumber = (int) $this->option('start');
        $chunkSize = (int) $this->option('chunk');
        $year = $this->option('year');
        $campus = $this->option('campus');

        // Check seed_progress for resume
        $progress = DB::table('seed_progress')->where('task', 'generate_users')->first();
        $resumeFrom = $progress ? (int) $progress->last_id : 0;
        $startIndex = $resumeFrom > 0 ? $resumeFrom : $startNumber;

        // Query raw SQL to get actual max existing userCode number for this year+campus
        // to handle any gaps/deletions in existing 26-A-* range
        $maxResult = DB::selectOne(
            "SELECT COALESCE(MAX(CAST(SUBSTRING(userCode, LOCATE('-', userCode) + 4) AS UNSIGNED)), 0) AS max_num
             FROM users WHERE userCode LIKE ?",
            ["{$year}-{$campus}-%"]
        );
        $maxExisting = $maxResult->max_num ?? 0;

        // Build a hash set of all existing userCodes for fast O(1) lookups (avoids DB queries per row)
        // Use only for the range up to maxExisting+500 (handles scattered gaps); beyond is clean
        $existingCodes = [];
        if ($maxExisting > 0) {
            $this->info("Loading existing userCodes into lookup table...");
            $rows = DB::select(
                "SELECT userCode FROM users WHERE userCode LIKE ?",
                ["{$year}-{$campus}-%"]
            );
            foreach ($rows as $row) {
                $existingCodes[$row->userCode] = true;
            }
            $this->info("Loaded " . count($existingCodes) . " existing userCodes.");
        }

        if ($maxExisting >= $startIndex) {
            $startIndex = $maxExisting + 1;
            $this->info("Adjusting start to {$startIndex} to avoid existing userCodes");
        }

        $this->info("Generating {$count} users starting from {$year}-{$campus}-{$startIndex}...");
        $this->info("Resume point: {$startIndex}");

        // Get registered status ID
        $statusId = DB::table('statuses')->where('name', 'registered')->value('id') ?? 1;

        // Role distribution: 80% student, 12% faculty, 5% program chairs, 3% deans
        $roles = [
            1, 1, 1, 1, 1, 1, 1, 1, 1, 1,  // 10 students (80%)
            1, 1, 2, 2,                      // 2 more students + 2 instructors (12%)
            3,                              // 1 program chair (5%)
            4,                              // 1 dean (3%)
        ];

        $firstNames = ['James', 'John', 'Robert', 'Michael', 'William', 'David', 'Richard',
                       'Joseph', 'Thomas', 'Charles', 'Mary', 'Patricia', 'Jennifer', 'Linda',
                       'Barbara', 'Elizabeth', 'Susan', 'Jessica', 'Sarah', 'Karen'];
        $lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller',
                      'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez',
                      'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'];

        $campuses = [1, 2, 3];
        $programs = [1, 2, 3, 4, 5, 6];

        $bar = $this->output->createProgressBar($count);
        $bar->start();

        $total = $startIndex + $count;
        $batch = [];
        $inserted = 0;
        $i = 0;
        $skipped = 0;

        for ($idx = $startIndex; $idx < $total; $idx++) {
            $userCode = sprintf('%02d-%s-%05d', $year, $campus, $idx);

            // Check against in-memory hash set (O(1) instead of DB query per row)
            if (isset($existingCodes[$userCode])) {
                $bar->advance(1);
                continue;
            }

            $firstName = $firstNames[array_rand($firstNames)];
            $lastName = $lastNames[array_rand($lastNames)];

            $batch[] = [
                'userCode' => $userCode,
                'firstName' => $firstName,
                'lastName' => $lastName,
                'email' => strtolower($firstName . '.' . $lastName . $idx . '@caps' . $idx . '.edu'),
                'password' => Hash::make('password123', ['rounds' => 4]),
                'roleID' => $roles[array_rand($roles)],
                'campusID' => $campuses[array_rand($campuses)],
                'programID' => $programs[array_rand($programs)],
                'isActive' => true,
                'status_id' => $statusId,
                'created_at' => now(),
                'updated_at' => now(),
            ];

            if (count($batch) >= $chunkSize) {
                DB::table('users')->insert($batch);
                $inserted += count($batch);
                $bar->advance(count($batch));
                $batch = [];
                $i++;

                // Update progress checkpoint every 5 chunks
                if ($i % 5 === 0) {
                    DB::table('seed_progress')->updateOrInsert(
                        ['task' => 'generate_users'],
                        ['last_id' => $idx + 1, 'updated_at' => now()]
                    );
                }
                // GC every 20 chunks
                if ($i % 20 === 0) {
                    gc_collect_cycles();
                }
            }
        }

        // Insert remaining
        if (!empty($batch)) {
            DB::table('users')->insert($batch);
            $bar->advance(count($batch));
        }

        $bar->finish();
        $this->newLine();

        // Clear checkpoint when done
        DB::table('seed_progress')->where('task', 'generate_users')->delete();

        $this->info("Done! Generated approximately {$count} users (starting from {$year}-{$campus}-{$startIndex}).");
        return 0;
    }
}