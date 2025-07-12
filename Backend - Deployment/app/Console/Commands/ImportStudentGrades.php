<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Modules\Users\Models\StudentGrade;
use Modules\Users\Models\Student;

// Helper function to safely convert to UTF-8
if (!function_exists('safe_utf8')) {
    function safe_utf8($value) {
        if (is_null($value) || $value === '') return $value;
        // Try to detect encoding from a list
        $encoding = mb_detect_encoding($value, ['UTF-8', 'ISO-8859-1', 'WINDOWS-1252', 'ASCII'], true);
        if ($encoding === 'UTF-8') return $value;
        if ($encoding !== false) return mb_convert_encoding($value, 'UTF-8', $encoding);
        // If detection fails, force to UTF-8, ignoring invalid bytes
        return iconv('UTF-8', 'UTF-8//IGNORE', $value);
    }
}

class ImportStudentGrades extends Command
{
    protected $signature = 'student-grades:import';
    protected $description = 'Import all CSV files from public/student_grades into the student_grades table';

    public function handle()
    {
        $directory = public_path('student_grades');
        $files = glob($directory . '/*.csv');
        if (empty($files)) {
            $this->info('No CSV files found in public/student_grades.');
            return 0;
        }

        foreach ($files as $file) {
            $this->info('Importing: ' . basename($file));
            $handle = fopen($file, 'r');
            if (!$handle) {
                $this->error('Could not open file: ' . $file);
                continue;
            }
            $headers = fgetcsv($handle);
            if (!$headers) {
                $this->error('Could not read headers from file: ' . $file);
                fclose($handle);
                continue;
            }
            // Normalize headers to lowercase for easier matching
            $headersLower = array_map('strtolower', $headers);
            $userCodeKey = in_array('usercode', $headersLower) ? array_search('usercode', $headersLower) : (in_array('code', $headersLower) ? array_search('code', $headersLower) : null);
            if ($userCodeKey === null) {
                $this->error('No userCode or code column found in file: ' . $file);
                fclose($handle);
                continue;
            }
            while (($row = fgetcsv($handle)) !== false) {
                try {
                    $record = array_combine($headers, $row);
                    // Support both userCode and code as the key
                    $userCode = $record[$headers[$userCodeKey]] ?? null;
                    $userCode = safe_utf8($userCode);

                    // Determine curriculumID based on userCode
                    $curriculumID = (strpos($userCode, '24-') === 0) ? 2 : 1;

                    // Update the student's curriculumID if a matching student exists
                    Student::where('userCode', $userCode)->update(['curriculumID' => $curriculumID]);

                    $data = [
                        'userCode' => $userCode,
                        'lastName' => isset($record['lastName']) ? safe_utf8($record['lastName']) : (isset($record['lastname']) ? safe_utf8($record['lastname']) : null),
                        'firstName' => isset($record['firstName']) ? safe_utf8($record['firstName']) : (isset($record['firstname']) ? safe_utf8($record['firstname']) : null),
                        'middleName' => isset($record['middleName']) ? safe_utf8($record['middleName']) : (isset($record['middlename']) ? safe_utf8($record['middlename']) : null),
                        'yearLevel' => isset($record['yearLevel']) ? safe_utf8($record['yearLevel']) : (isset($record['yearlevel']) ? safe_utf8($record['yearlevel']) : null),
                        'subjectCode' => isset($record['subjectCode']) ? safe_utf8($record['subjectCode']) : (isset($record['subjectcode']) ? safe_utf8($record['subjectcode']) : null),
                        'subjectDesc' => isset($record['subjectDesc']) ? safe_utf8($record['subjectDesc']) : (isset($record['subjectdesc']) ? safe_utf8($record['subjectdesc']) : null),
                    ];

                    $genAve = trim($record['genAve'] ?? '');
                    if ($genAve === '') {
                        $data['genAve'] = null;
                        $data['finalGrade'] = null;
                    } elseif (in_array(strtoupper($genAve), ['DR', 'DROPPED'])) {
                        $data['genAve'] = -1;
                        $data['finalGrade'] = -1;
                    } elseif (in_array(strtoupper($genAve), ['INC', 'INCOMPLETE'])) {
                        $data['genAve'] = -2;
                        $data['finalGrade'] = -2;
                    } else {
                        $data['genAve'] = is_numeric($genAve) ? round((float)$genAve, 1) : null;
                    }

                    $reEx = trim($record['reEx'] ?? '');
                    $data['reEx'] = is_numeric($reEx) ? round((float)$reEx, 1) : null;

                    // Always use reEx for finalGrade if present and numeric
                    if ($reEx !== '' && is_numeric($reEx)) {
                        $data['finalGrade'] = round((float)$reEx, 1);
                    } elseif ($genAve === '') {
                        $data['finalGrade'] = null;
                    } elseif (in_array(strtoupper($genAve), ['DR', 'DROPPED'])) {
                        $data['finalGrade'] = -1;
                    } elseif (in_array(strtoupper($genAve), ['INC', 'INCOMPLETE'])) {
                        $data['finalGrade'] = -2;
                    } elseif (is_numeric($genAve)) {
                        $data['finalGrade'] = round((float)$genAve, 1);
                    } else {
                        $data['finalGrade'] = null;
                    }

                    StudentGrade::create($data);
                } catch (\Exception $e) {
                    $this->error('Error importing userCode ' . ($record[$headers[$userCodeKey]] ?? '[unknown]') . ': ' . $e->getMessage());
                    continue;
                }
            }
            fclose($handle);
        }
        $this->info('All CSV files imported successfully.');
        return 0;
    }
} 