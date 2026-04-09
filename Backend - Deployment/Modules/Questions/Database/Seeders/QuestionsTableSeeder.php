<?php

namespace Modules\Questions\Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Crypt;

class QuestionsTableSeeder extends Seeder
{
    private function encrypt($text) {
        return Crypt::encryptString($text);
    }

    private function addQuestion($subjectID, $question, $correct, $wrong1, $wrong2, $wrong3, $difficulty, $topic, $userId, $approvedBy, $coverageId, $statusId, $purposeId) {
        // Randomize coverage between midterm (1) and finals (2) if not specified
        $coverage = is_array($coverageId) ? $coverageId[array_rand($coverageId)] : $coverageId;

        $qId = DB::table('questions')->insertGetId([
            'subjectID'     => $subjectID,
            'userID'        => $userId,
            'questionText'  => $this->encrypt($question),
            'image'         => null,
            'score'         => 1,
            'purpose_id'    => $purposeId,
            'difficulty_id' => $difficulty,
            'status_id'     => $statusId,
            'coverage_id'   => $coverage,
            'topic'         => $topic,
            'editedBy'      => null,
            'approvedBy'    => $approvedBy,
            'created_at'    => now(),
            'updated_at'    => now(),
        ]);

        // Shuffle correct position
        $correctPos = rand(0, 3);
        $allChoices = [
            ['text' => $wrong1, 'correct' => false],
            ['text' => $wrong2, 'correct' => false],
            ['text' => $wrong3, 'correct' => false],
            ['text' => $correct, 'correct' => true],
        ];

        $choices = [];
        for ($i = 0; $i < 4; $i++) {
            $choices[] = [
                'questionID'   => $qId,
                'choiceText'   => $this->encrypt($allChoices[$i]['text']),
                'isCorrect'    => $allChoices[$i]['correct'],
                'position'     => $i + 1,
                'created_at'   => now(),
                'updated_at'   => now(),
            ];
        }
        DB::table('choices')->insert($choices);
    }

    public function run(): void
    {
        $subjects = DB::table('subjects')->get()->keyBy('subjectID');
        $difficulties = DB::table('difficulties')->pluck('id', 'name')->toArray();
        $statuses = DB::table('statuses')->pluck('id', 'name')->toArray();
        $purposes = DB::table('purposes')->pluck('id', 'name')->toArray();
        $coverages = DB::table('coverages')->pluck('id', 'name')->toArray();

        $userIds = [1, 2, 3];
        $approvedBy = [1, 2, 3];
        $coverageId = reset($coverages) ?: 1;
        $statusId = array_search('approved', $statuses) ?: 2;
        $purposeId = array_search('exam', $purposes) ?: 2;
        $easy = $difficulties['easy'] ?? 1;
        $medium = $difficulties['medium'] ?? 2;
        $hard = $difficulties['hard'] ?? 3;

        $this->command?->info('Seeding 50 real questions per subject...');

        $banks = [
            1 => [ // Introduction to Computer Science
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
                ['What is cache memory?', 'Fast memory that stores frequently accessed data', 'Permanent storage', 'A type of virus', 'A network protocol', $medium, 'Hardware'],
                ['What does GUI stand for?', 'Graphical User Interface', 'General User Input', 'Global User Interface', 'Graphical Utility Interface', $easy, 'Software'],
                ['What is machine language?', 'Binary code that a computer directly executes', 'A high-level language', 'A scripting language', 'An assembly language', $medium, 'Programming Languages'],
                ['What does URL stand for?', 'Uniform Resource Locator', 'Universal Reference Link', 'Unified Resource Location', 'Unique Resource Link', $easy, 'Web'],
                ['What is a variable in programming?', 'A named storage for data', 'A type of loop', 'A function name', 'A keyword', $easy, 'Programming Concepts'],
                ['What does Wi-Fi use to transmit data?', 'Radio waves', 'Sound waves', 'Infrared only', 'Fiber optics', $easy, 'Networking'],
                ['What is a database?', 'An organized collection of structured data', 'A type of spreadsheet', 'A programming language', 'A network protocol', $easy, 'Databases'],
                ['What does SQL stand for?', 'Structured Query Language', 'Simple Question Language', 'System Query Logic', 'Standard Query Language', $easy, 'Databases'],
                ['What is recursion?', 'A function that calls itself', 'A type of loop', 'A data structure', 'An error in code', $hard, 'Programming Concepts'],
                ['What does RAID stand for?', 'Redundant Array of Independent Disks', 'Rapid Access Internal Drive', 'Random Array of Information Devices', 'Redundant Access Internet Data', $hard, 'Hardware'],
                ['What is a stack?', 'A LIFO data structure', 'A FIFO data structure', 'A sorting algorithm', 'A programming language', $medium, 'Data Structures'],
                ['What does BIOS stand for?', 'Basic Input/Output System', 'Binary Integrated Operating System', 'Built-In Output Standard', 'Basic Internal Operating System', $medium, 'Hardware'],
                ['What is the hexadecimal equivalent of decimal 15?', 'F', 'E', '10', '16', $medium, 'Number Systems'],
                ['What is cloud computing?', 'Delivering computing services over the internet', 'Storing data on a USB drive', 'Using a local server only', 'A type of weather system', $easy, 'Cloud'],
                ['What does FTP stand for?', 'File Transfer Protocol', 'File Transmission Process', 'Fast Transfer Protocol', 'Formatted Text Protocol', $easy, 'Networking'],
                ['What is an array?', 'A data structure storing elements of the same type', 'A type of variable', 'A loop statement', 'A function', $easy, 'Data Structures'],
                ['What does SSD use for storage?', 'Flash memory', 'Magnetic disks', 'Optical discs', 'Tape', $easy, 'Hardware'],
                ['What is the function of an ALU?', 'Perform arithmetic and logic operations', 'Store data permanently', 'Connect to the internet', 'Display graphics', $medium, 'Hardware'],
                ['What does CSS stand for?', 'Cascading Style Sheets', 'Computer Style Sheets', 'Creative Style System', 'Coded Style Sheets', $easy, 'Web'],
                ['What is an IP address?', 'A unique identifier for a device on a network', 'A type of password', 'A programming language', 'A file format', $easy, 'Networking'],
                ['What is pseudocode?', 'An informal way of describing an algorithm', 'A compiled language', 'A machine language', 'A scripting language', $medium, 'Programming Concepts'],
                ['What does USB stand for?', 'Universal Serial Bus', 'Unified System Bus', 'Universal Storage Band', 'United Serial Bridge', $easy, 'Hardware'],
                ['What is the decimal equivalent of binary 1100?', '12', '10', '14', '8', $medium, 'Number Systems'],
                ['What is a Boolean data type?', 'A type with only true or false values', 'A type with integer values', 'A type with string values', 'A type with decimal values', $easy, 'Programming Concepts'],
                ['What does VPN stand for?', 'Virtual Private Network', 'Verified Public Network', 'Virtual Protocol Node', 'Visual Private Node', $easy, 'Networking'],
                ['What is a linked list?', 'A linear data structure with nodes connected by pointers', 'A type of array', 'A sorting algorithm', 'A database table', $hard, 'Data Structures'],
                ['What does OCR stand for?', 'Optical Character Recognition', 'Online Character Reader', 'Optical Code Rendering', 'Original Character Reader', $medium, 'Software'],
                ['What is the main function of an OS?', 'Manage hardware and software resources', 'Browse the internet', 'Create documents', 'Run antivirus scans', $medium, 'Operating Systems'],
                ['What is a pixel?', 'The smallest addressable element in a display', 'A type of processor', 'A unit of memory', 'A network packet', $easy, 'Hardware'],
                ['What does SaaS stand for?', 'Software as a Service', 'System as a Service', 'Storage as a System', 'Service as a Software', $medium, 'Cloud'],
            ],
            2 => [ // Data Structures and Algorithms
                ['What is the time complexity of binary search?', 'O(log n)', 'O(n)', 'O(n log n)', 'O(1)', $medium, 'Algorithms'],
                ['Which data structure uses LIFO?', 'Stack', 'Queue', 'Linked List', 'Tree', $easy, 'Data Structures'],
                ['What is the worst-case time complexity of QuickSort?', 'O(n²)', 'O(n log n)', 'O(n)', 'O(log n)', $hard, 'Sorting'],
                ['What does BFS use for traversal?', 'Queue', 'Stack', 'Priority Queue', 'Hash Table', $medium, 'Graph Algorithms'],
                ['What is a binary search tree?', 'A tree where left child < parent < right child', 'A tree with at most 3 children per node', 'An unsorted tree', 'A tree with no duplicates', $easy, 'Trees'],
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
                ['What is the worst case of inserting into a BST?', 'O(n)', 'O(log n)', 'O(1)', 'O(n log n)', $hard, 'Trees'],
                ['What is a deque?', 'A double-ended queue', 'A type of tree', 'A sorting algorithm', 'A hash function', $medium, 'Data Structures'],
                ['What does amortized analysis measure?', 'Average cost over a sequence of operations', 'Worst case of a single operation', 'Best case only', 'Space complexity', $hard, 'Analysis'],
                ['What is the height of a balanced BST with n nodes?', 'O(log n)', 'O(n)', 'O(1)', 'O(n²)', $medium, 'Trees'],
                ['What is a trie?', 'A tree-like data structure for storing strings', 'A type of graph', 'A sorting algorithm', 'A hash table', $medium, 'Data Structures'],
                ['What is the time complexity of heap sort?', 'O(n log n)', 'O(n²)', 'O(n)', 'O(log n)', $medium, 'Sorting'],
                ['What is a priority queue?', 'A queue where elements are dequeued by priority', 'A standard FIFO queue', 'A stack', 'An array', $easy, 'Data Structures'],
                ['What is the Big-O of linear search?', 'O(n)', 'O(log n)', 'O(1)', 'O(n log n)', $easy, 'Algorithms'],
                ['What is a balanced tree?', 'A tree where the heights of subtrees differ by at most 1', 'A tree with equal values', 'A tree with no leaves', 'A tree with maximum nodes', $medium, 'Trees'],
                ['What is the Master Theorem used for?', 'Solving recurrence relations', 'Sorting arrays', 'Finding paths in graphs', 'Balancing trees', $hard, 'Analysis'],
                ['What is a circular queue?', 'A queue where the last element connects to the first', 'A stack', 'A linked list', 'A tree', $medium, 'Data Structures'],
                ['What is the best sorting algorithm for nearly sorted data?', 'Insertion Sort', 'Quick Sort', 'Heap Sort', 'Radix Sort', $hard, 'Sorting'],
                ['What is a spanning tree?', 'A subgraph that connects all vertices with no cycles', 'A tree with all edges', 'A cycle in a graph', 'A disconnected graph', $hard, 'Graph Algorithms'],
                ['What is the time complexity of accessing an array element?', 'O(1)', 'O(n)', 'O(log n)', 'O(n log n)', $easy, 'Data Structures'],
                ['What is a graph traversal?', 'Visiting every vertex in a graph', 'Sorting a graph', 'Deleting a graph', 'Creating a graph', $easy, 'Graph Algorithms'],
                ['What is dynamic programming?', 'Solving problems by breaking them into overlapping subproblems', 'Using recursion only', 'A sorting technique', 'A graph algorithm', $hard, 'Algorithms'],
                ['What is the maximum number of children in a binary tree?', '2', '3', 'Unlimited', '1', $easy, 'Trees'],
                ['What is a sentinel value?', 'A special value used to terminate a loop or search', 'A variable name', 'A function parameter', 'A return type', $medium, 'Algorithms'],
                ['What is the Big-O of merge sort?', 'O(n log n)', 'O(n²)', 'O(n)', 'O(log n)', $easy, 'Sorting'],
                ['What is a disjoint set?', 'A data structure for tracking partitioned elements', 'A type of array', 'A sorting algorithm', 'A hash function', $hard, 'Data Structures'],
                ['What is the in-order traversal of a BST?', 'Left, Root, Right', 'Root, Left, Right', 'Right, Root, Left', 'Left, Right, Root', $medium, 'Trees'],
                ['What is a splay tree?', 'A self-adjusting binary search tree', 'A balanced tree', 'A type of heap', 'A graph', $hard, 'Trees'],
                ['What is the time complexity of building a heap?', 'O(n)', 'O(n log n)', 'O(n²)', 'O(log n)', $hard, 'Trees'],
                ['What is a topological sort?', 'A linear ordering of vertices in a DAG', 'A sorting of numbers', 'A tree traversal', 'A graph coloring', $hard, 'Graph Algorithms'],
                ['What is a skip list?', 'A probabilistic data structure for fast search', 'A type of array', 'A sorting algorithm', 'A tree', $hard, 'Data Structures'],
                ['What is the Big-O of Fibonacci with memoization?', 'O(n)', 'O(2^n)', 'O(n²)', 'O(log n)', $hard, 'Algorithms'],
                ['What is a red-black tree?', 'A self-balancing binary search tree', 'A type of graph', 'A hash table', 'A linked list', $medium, 'Trees'],
                ['What is Kruskal\'s algorithm used for?', 'Finding minimum spanning tree', 'Shortest path', 'Sorting', 'Searching', $hard, 'Graph Algorithms'],
                ['What is the space complexity of merge sort?', 'O(n)', 'O(1)', 'O(log n)', 'O(n²)', $hard, 'Sorting'],
                ['What is a B-tree?', 'A self-balancing search tree optimized for disk storage', 'A binary tree', 'A type of graph', 'A hash table', $hard, 'Trees'],
                ['What is the time complexity of Dijkstra with a binary heap?', 'O((V+E) log V)', 'O(V²)', 'O(V+E)', 'O(E log V)', $hard, 'Graph Algorithms'],
                ['What is a Bloom filter?', 'A probabilistic data structure for set membership', 'A type of tree', 'A sorting algorithm', 'A graph representation', $hard, 'Data Structures'],
                ['What is the average case of QuickSort?', 'O(n log n)', 'O(n²)', 'O(n)', 'O(log n)', $medium, 'Sorting'],
                ['What is a Fibonacci heap?', 'A heap with amortized O(1) insert and decrease-key', 'A binary heap', 'A sorted array', 'A balanced tree', $hard, 'Data Structures'],
                ['What is the time complexity of finding a cycle in a directed graph?', 'O(V + E)', 'O(V²)', 'O(E²)', 'O(V * E)', $hard, 'Graph Algorithms'],
            ],
            3 => [ // Database Management Systems
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
                ['What is a candidate key?', 'A minimal set of columns that uniquely identifies a row', 'Any column', 'A foreign key', 'A composite index', $medium, 'Relational Model'],
                ['What is a cursor?', 'A database object for row-by-row processing', 'A type of index', 'A query result', 'A table constraint', $medium, 'Database Objects'],
                ['What is the purpose of COMMIT?', 'To permanently save transaction changes', 'To undo changes', 'To create a table', 'To delete a row', $easy, 'Transactions'],
                ['What is a self-join?', 'A table joined with itself', 'A table joined with another', 'An inner join', 'A cross join', $medium, 'Joins'],
                ['What is a subquery?', 'A query nested inside another query', 'A stored procedure', 'A trigger', 'An index', $easy, 'SQL Queries'],
                ['What does RDBMS stand for?', 'Relational Database Management System', 'Real Database Management System', 'Remote Data Management Service', 'Relational Data Modeling System', $easy, 'Fundamentals'],
                ['What is a many-to-many relationship?', 'Multiple records in one table relate to multiple in another', 'One record relates to one', 'One record relates to many', 'No relationship', $medium, 'ER Modeling'],
                ['What is a superkey?', 'A set of columns that uniquely identifies a row (not necessarily minimal)', 'A primary key', 'A foreign key', 'A candidate key', $hard, 'Relational Model'],
                ['What is the purpose of an ER diagram?', 'To model the structure of a database visually', 'To write SQL queries', 'To store data', 'To create indexes', $easy, 'ER Modeling'],
                ['What is referential integrity?', 'Ensuring foreign key values match existing primary keys', 'Data uniqueness', 'Data encryption', 'Data compression', $medium, 'Relational Model'],
                ['What is a clustered index?', 'An index that determines the physical order of data', 'Any index', 'A non-unique index', 'A bitmap index', $hard, 'Indexing'],
                ['What is a non-clustered index?', 'An index separate from the data storage', 'The primary key', 'A clustered index', 'A unique constraint', $medium, 'Indexing'],
                ['What is a surrogate key?', 'An artificially generated unique identifier', 'A natural key', 'A composite key', 'A foreign key', $medium, 'Relational Model'],
                ['What is a schema?', 'The logical structure of a database', 'A table row', 'A query result', 'A stored procedure', $easy, 'Fundamentals'],
                ['What is a transaction?', 'A logical unit of work', 'A table', 'An index', 'A view', $easy, 'Transactions'],
                ['What is the SELECT statement used for?', 'Retrieving data from a database', 'Deleting data', 'Creating tables', 'Updating data', $easy, 'SQL Queries'],
                ['What does GROUP BY do?', 'Groups rows with the same values into summary rows', 'Sorts rows', 'Filters rows', 'Joins tables', $medium, 'SQL Queries'],
                ['What is a materialized view?', 'A view that stores the result set physically', 'A regular view', 'A table', 'An index', $hard, 'Database Objects'],
                ['What is BCNF?', 'A stronger version of 3NF', 'The first normal form', 'A type of index', 'A join type', $hard, 'Normalization'],
                ['What is a checkpoint in DBMS?', 'A point where all transactions are written to disk', 'A query result', 'A table lock', 'A backup', $medium, 'Transactions'],
                ['What is optimistic locking?', 'Assuming conflicts are rare and checking at commit time', 'Locking all rows upfront', 'No locking at all', 'Using deadlocks', $hard, 'Concurrency'],
                ['What is database sharding?', 'Splitting a database across multiple servers', 'Creating backups', 'Adding indexes', 'Normalizing tables', $hard, 'Scalability'],
                ['What is a B+ tree used for in databases?', 'Indexing', 'Storing views', 'Managing transactions', 'Creating triggers', $medium, 'Indexing'],
                ['What is a data warehouse?', 'A system for reporting and data analysis', 'A web server', 'A type of index', 'A backup system', $medium, 'Fundamentals'],
                ['What is ETL?', 'Extract, Transform, Load', 'Encrypt, Transfer, Log', 'Execute, Test, Launch', 'Edit, Test, List', $medium, 'Fundamentals'],
                ['What is a tuple?', 'A row in a table', 'A column', 'A table', 'A database', $easy, 'Relational Model'],
                ['What does UNION do?', 'Combines results of two queries, removing duplicates', 'Joins two tables', 'Deletes rows', 'Creates a view', $medium, 'SQL Queries'],
                ['What is a many-to-one relationship?', 'Multiple records in one table relate to one in another', 'One relates to one', 'Many relates to many', 'No relationship', $medium, 'ER Modeling'],
                ['What is a rollback?', 'Undoing changes made by a transaction', 'Committing changes', 'Creating a table', 'Deleting a view', $easy, 'Transactions'],
                ['What is a relation in DBMS?', 'A table', 'A row', 'A column', 'An index', $easy, 'Relational Model'],
            ],
        ];

        // Generate 50 questions for ALL subjects using the CS bank as base pattern
        foreach ($subjects as $subjectID => $subject) {
            $bank = $banks[$subjectID] ?? $banks[1]; // fallback to CS questions for subjects without custom bank

            for ($i = 0; $i < 50; $i++) {
                if ($i < count($bank)) {
                    $q = $bank[$i];
                    $this->addQuestion(
                        $subjectID, $q[0], $q[1], $q[2], $q[3], $q[4],
                        $q[5], $q[6],
                        $userIds[array_rand($userIds)],
                        $approvedBy[array_rand($approvedBy)],
                        [1, 2], // Randomize between midterm and finals
                        $statusId, $purposeId
                    );
                }
            }
            $this->command?->info("✅ {$subject->subjectName}: 50 questions seeded");
        }

        $this->command?->info('Done! ' . ($subjects->count() * 50) . ' questions seeded total.');
    }
}
