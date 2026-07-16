<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Crypt;

class GenerateQuestionsCommand extends Command
{
    protected $signature = 'data:generate-questions
                            {--subjects=1000000 : Number of subjects to add questions to}
                            {--chunk=1000 : Questions per subject batch}
                            {--min=10 : Min questions per subject}
                            {--max=50 : Max questions per subject}
                            {--no-encrypt : Store text in plain (faster for test data)}';

    protected $description = 'Generate questions + choices for subjects, reusing seeder question banks';

    public function handle(): int
    {
        $subjectCount = (int) $this->option('subjects');
        $chunkSize = (int) $this->option('chunk');
        $minQ = (int) $this->option('min');
        $maxQ = (int) $this->option('max');
        $encrypt = !$this->option('no-encrypt');

        $this->info("Generating questions for up to {$subjectCount} subjects...");
        $this->info("Questions per subject: {$minQ}–{$maxQ}");
        $this->info("Encryption: " . ($encrypt ? 'ON' : 'OFF (plain text)'));

        // Load lookup tables
        $difficulties = DB::table('difficulties')->pluck('id', 'name')->toArray();
        $statuses = DB::table('statuses')->pluck('id', 'name')->toArray();
        $coverages = DB::table('coverages')->pluck('id', 'name')->toArray();
        $purposes = DB::table('purposes')->pluck('id', 'name')->toArray();

        $statusId = $statuses['approved'] ?? 2;
        $purposeId = $purposes['exam'] ?? 2;
        $easy = $difficulties['easy'] ?? 1;
        $medium = $difficulties['medium'] ?? 2;
        $hard = $difficulties['hard'] ?? 3;

        // Question banks from QuestionsTableSeeder.php (3 subjects × 50 questions each)
        $banks = [
            1 => [
                ['What does CPU stand for?', 'Central Processing Unit', 'Central Program Utility', 'Computer Personal Unit', 'Central Peripheral Interface', $easy, 'Hardware'],
                ['Which is a programming language?', 'Python', 'HTML', 'Photoshop', 'Excel', $easy, 'Programming Languages'],
                ['What is an algorithm?', 'A step-by-step procedure for solving a problem', 'A type of computer virus', 'A programming language', 'A hardware component', $easy, 'Fundamentals'],
                ['What does RAM stand for?', 'Random Access Memory', 'Read Access Memory', 'Random Assigned Memory', 'Rapid Access Module', $easy, 'Hardware'],
                ['Which is NOT an operating system?', 'Microsoft Word', 'Windows', 'macOS', 'Linux', $easy, 'Operating Systems'],
                ['What does HTML stand for?', 'HyperText Markup Language', 'HyperText Making Language', 'High Tech Modern Language', 'Hyper Transfer Markup Language', $easy, 'Web'],
                ['What is a bit?', 'The smallest unit of data in a computer', 'A type of software', 'A programming language', 'A hardware device', $easy, 'Fundamentals'],
                ['How many bits in a byte?', '8', '4', '16', '32', $easy, 'Fundamentals'],
                ['What does GPU stand for?', 'Graphics Processing Unit', 'General Processing Unit', 'Graphical Power Unit', 'Global Processing Utility', $easy, 'Hardware'],
                ['Which is a high-level programming language?', 'C++', 'Assembly', 'Machine Code', 'Binary', $medium, 'Programming Languages'],
                ['What is the binary representation of decimal 5?', '101', '110', '111', '100', $medium, 'Number Systems'],
                ['What does IDE stand for in programming?', 'Integrated Development Environment', 'Internet Development Engine', 'Internal Data Exchange', 'Integrated Design Editor', $easy, 'Tools'],
                ['What is a compiler?', 'A program that translates source code to machine code', 'A type of virus', 'A hardware component', 'A storage device', $medium, 'Programming Languages'],
                ['What does SSD stand for?', 'Solid State Drive', 'Super Speed Drive', 'Serial Storage Device', 'System State Disk', $easy, 'Hardware'],
                ['What is the octal equivalent of decimal 8?', '10', '8', '12', '11', $medium, 'Number Systems'],
                ['What does API stand for?', 'Application Programming Interface', 'Advanced Program Integration', 'Automated Processing Interface', 'Application Process Input', $medium, 'Software'],
                ['What is a firewall?', 'A network security system', 'A type of software bug', 'A programming language', 'A hardware component', $easy, 'Security'],
                ['What does DNS stand for?', 'Domain Name System', 'Data Network Service', 'Dynamic Name Server', 'Digital Network System', $medium, 'Networking'],
                ['What is open-source software?', 'Software with publicly available source code', 'Software that costs nothing', 'Software without bugs', 'Software only for students', $easy, 'Software'],
                ['What does HTTP use as default port?', '80', '21', '443', '8080', $medium, 'Networking'],
            ],
            2 => [
                ['What is the time complexity of binary search?', 'O(log n)', 'O(n)', 'O(n log n)', 'O(1)', $medium, 'Algorithms'],
                ['Which data structure uses LIFO?', 'Stack', 'Queue', 'Linked List', 'Tree', $easy, 'Data Structures'],
                ['What is the worst-case time complexity of QuickSort?', 'O(n²)', 'O(n log n)', 'O(n)', 'O(log n)', $hard, 'Sorting'],
                ['What does BFS use for traversal?', 'Queue', 'Stack', 'Priority Queue', 'Hash Table', $medium, 'Graph Algorithms'],
                ['What is a binary search tree?', 'A tree where left child < parent < right child', 'A tree with at most 3 children per node', 'An unsorted tree', 'A tree with no duplicates allowed', $medium, 'Trees'],
                ['What is the space complexity of DFS?', 'O(h) where h is the height', 'O(n)', 'O(1)', 'O(log n)', $hard, 'Graph Algorithms'],
                ['Which sorting algorithm is stable?', 'Merge Sort', 'Quick Sort', 'Selection Sort', 'Heap Sort', $hard, 'Sorting'],
                ['What is a hash collision?', 'Two keys producing the same hash value', 'A hash table running out of memory', 'A deleted key', 'A null hash function', $medium, 'Hash Tables'],
                ['What is the best case time for Bubble Sort?', 'O(n)', 'O(n²)', 'O(log n)', 'O(n log n)', $medium, 'Sorting'],
                ['What does AVL stand for?', 'Adelson-Velsky and Landis', 'Advanced Variable List', 'Array Value Logic', 'Automated Vector Library', $hard, 'Trees'],
                ['What is a heap?', 'A complete binary tree satisfying the heap property', 'A linked list', 'A hash table', 'A graph', $medium, 'Trees'],
                ['What is the time complexity of inserting into a BST?', 'O(log n) average', 'O(1)', 'O(n²)', 'O(n log n)', $medium, 'Trees'],
                ['Which algorithm finds the shortest path?', "Dijkstra's algorithm", 'Bubble Sort', 'Binary Search', 'Merge Sort', $medium, 'Graph Algorithms'],
                ['What is the minimum number of nodes in a binary tree of height h?', 'h + 1', '2^h', '2^(h+1) - 1', 'h', $hard, 'Trees'],
                ['What is a graph?', 'A collection of vertices connected by edges', 'A type of array', 'A sorting method', 'A search algorithm', $easy, 'Graph Algorithms'],
                ['What is a deque?', 'A double-ended queue', 'A type of tree', 'A sorting algorithm', 'A hash function', $medium, 'Data Structures'],
                ['What is a priority queue?', 'A queue where elements are dequeued by priority', 'A standard FIFO queue', 'A stack', 'An array', $easy, 'Data Structures'],
                ['What is the Big-O of linear search?', 'O(n)', 'O(log n)', 'O(1)', 'O(n log n)', $easy, 'Algorithms'],
                ['What is a balanced tree?', 'A tree where heights of subtrees differ by at most 1', 'A tree with equal values', 'A tree with no leaves', 'A tree with maximum nodes', $medium, 'Trees'],
                ['What is a topological sort?', 'A linear ordering of vertices in a DAG', 'A sorting of numbers', 'A tree traversal', 'A graph coloring', $hard, 'Graph Algorithms'],
            ],
            3 => [
                ['What does SQL stand for?', 'Structured Query Language', 'Simple Question Language', 'System Query Logic', 'Standard Query Language', $easy, 'SQL Basics'],
                ['Which normal form eliminates transitive dependency?', 'Third Normal Form', 'First Normal Form', 'Second Normal Form', 'BCNF', $medium, 'Normalization'],
                ['What is a primary key?', 'A column that uniquely identifies each row', 'Any nullable column', 'A column used for indexing only', 'A foreign key', $easy, 'Relational Model'],
                ['Which SQL clause filters grouped results?', 'HAVING', 'WHERE', 'ORDER BY', 'GROUP BY', $medium, 'SQL Queries'],
                ['What does ACID stand for?', 'Atomicity, Consistency, Isolation, Durability', 'Availability, Consistency, Integrity, Durability', 'Atomicity, Concurrency, Isolation, Dependency', 'Authentication, Consistency, Isolation, Durability', $hard, 'Transactions'],
                ['Which join returns all rows from both tables?', 'FULL OUTER JOIN', 'INNER JOIN', 'LEFT JOIN', 'CROSS JOIN', $medium, 'Joins'],
                ['What is an index?', 'A data structure that improves data retrieval speed', 'A backup copy', 'A database trigger', 'A stored procedure', $easy, 'Indexing'],
                ['Which is a NoSQL database?', 'MongoDB', 'MySQL', 'PostgreSQL', 'Oracle', $easy, 'NoSQL'],
                ['What is a foreign key?', 'A column that references the primary key of another table', 'A unique identifier', 'A primary key', 'A nullable column', $easy, 'Relational Model'],
                ['What is a deadlock?', 'Two transactions waiting for each other to release locks', 'A slow query', 'A null result', 'A corrupted table', $hard, 'Concurrency'],
                ['What is a view?', 'A virtual table based on a query result', 'A physical table', 'A backup', 'An index', $medium, 'SQL Basics'],
                ['What does DDL stand for?', 'Data Definition Language', 'Data Display Language', 'Dynamic Data Link', 'Digital Data Layer', $easy, 'SQL Basics'],
                ['What is the result of a CROSS JOIN?', 'Cartesian product of both tables', 'Only matching rows', 'All rows from the left table', 'All rows from the right table', $medium, 'Joins'],
                ['What is a trigger?', 'A stored procedure that executes automatically on an event', 'A type of index', 'A query result', 'A table constraint', $medium, 'Database Objects'],
                ['What is a composite key?', 'A key made of two or more columns', 'A single column key', 'A foreign key', 'A nullable key', $medium, 'Relational Model'],
                ['Which SQL command removes all rows but keeps the table?', 'TRUNCATE', 'DELETE', 'DROP', 'ALTER', $medium, 'SQL Basics'],
                ['What is a stored procedure?', 'A precompiled collection of SQL statements', 'A type of table', 'An index', 'A view', $medium, 'Database Objects'],
                ['What is 1NF?', 'Each column contains atomic values', 'No transitive dependencies', 'No partial dependencies', 'Every column is a key', $medium, 'Normalization'],
                ['What is denormalization?', 'Adding redundancy to improve read performance', 'Removing redundancy', 'Creating indexes', 'Dropping tables', $hard, 'Normalization'],
                ['What does DML stand for?', 'Data Manipulation Language', 'Data Management Layer', 'Digital Memory Language', 'Dynamic Modeling Language', $easy, 'SQL Basics'],
            ],
        ];

        // Get subjects in chunks
        $lastSubjectId = 0;
        $totalQuestions = 0;
        $totalChoices = 0;
        $chunk = [];

        $this->info("Processing subjects...");

        while (true) {
            $subjects = DB::table('subjects')
                ->where('subjectID', '>', $lastSubjectId)
                ->where('is_enabled_for_exam_questions', 1)
                ->orderBy('subjectID')
                ->limit($chunkSize)
                ->get();

            if ($subjects->isEmpty()) {
                break;
            }

            foreach ($subjects as $subject) {
                $lastSubjectId = $subject->subjectID;
                $bankId = ($subject->subjectID % 3) + 1;
                $bank = $banks[$bankId];
                $questionCount = rand($minQ, $maxQ);

                for ($q = 0; $q < $questionCount; $q++) {
                    $template = $bank[$q % count($bank)];
                    [$questionText, $correct, $wrong1, $wrong2, $wrong3, $difficultyId, $topic] = $template;

                    $variantText = $questionText . " (Subject {$subject->subjectID}, Q" . ($q + 1) . ")";
                    $text = $encrypt ? Crypt::encryptString($variantText) : $variantText;

                    $questionId = DB::table('questions')->insertGetId([
                        'subjectID' => $subject->subjectID,
                        'userID' => 1,
                        'questionText' => $text,
                        'image' => null,
                        'score' => 1,
                        'purpose_id' => $purposeId,
                        'difficulty_id' => $difficultyId,
                        'status_id' => $statusId,
                        'coverage_id' => ($q % 2) + 1, // Alternate midterm/finals
                        'topic' => $topic,
                        'editedBy' => null,
                        'approvedBy' => 1,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);

                    $totalQuestions++;

                    // Generate 4 choices — no orphaned questions!
                    $correctPos = rand(0, 3);
                    $choices = [
                        ['text' => $correct,      'correct' => $correctPos === 0],
                        ['text' => $wrong1,        'correct' => $correctPos === 1],
                        ['text' => $wrong2,        'correct' => $correctPos === 2],
                        ['text' => $wrong3,        'correct' => $correctPos === 3],
                    ];

                    $choiceRows = [];
                    for ($c = 0; $c < 4; $c++) {
                        $choiceText = $encrypt ? Crypt::encryptString($choices[$c]['text']) : $choices[$c]['text'];
                        $choiceRows[] = [
                            'questionID' => $questionId,
                            'choiceText' => $choiceText,
                            'isCorrect' => $choices[$c]['correct'],
                            'position' => $c + 1,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ];
                    }

                    DB::table('choices')->insert($choiceRows);
                    $totalChoices += 4;
                }

                // Progress update every 10 subjects
                if ($subject->subjectID % 10 === 0) {
                    $this->info("  Subject {$subject->subjectID}: +{$questionCount} questions (total: {$totalQuestions} Q, {$totalChoices} choices)");
                    gc_collect_cycles();
                }
            }
        }

        $this->info("Done! Generated {$totalQuestions} questions with {$totalChoices} choices.");
        return 0;
    }
}