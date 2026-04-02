<?php

namespace Modules\PersonalExams\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Modules\PersonalExams\Models\StudentQuizResult;
use Modules\PersonalClasses\Models\ClassPersonalQuiz;
use Modules\PersonalClasses\Models\ClassEnrollment;
use Modules\PersonalClasses\Models\ClassModel;

class StudentQuizResultController extends Controller
{
    /**
     * Get all quiz results (with filters).
     * Faculty can see results for their classes, students can see their own results.
     */
    public function index(Request $request)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return response()->json(['success' => false, 'message' => 'Unauthorized'], 401);
            }

            $query = StudentQuizResult::with(['classQuizAssignment.personalQuiz', 'classQuizAssignment.class', 'student']);

            // Students can only see their own results
            if ($user->roleID == 1) {
                $query->where('studentID', $user->userID);
            } 
            // Faculty can see results for their classes
            elseif (in_array($user->roleID, [2, 3, 4, 5])) {
                // Filter by class if provided
                if ($request->has('classID')) {
                    $classID = $request->input('classID');
                    $query->whereHas('classQuizAssignment', function($q) use ($classID) {
                        $q->where('classID', $classID);
                    });
                }
                
                // Filter by quiz if provided
                if ($request->has('personalQuizID')) {
                    $personalQuizID = $request->input('personalQuizID');
                    $query->whereHas('classQuizAssignment', function($q) use ($personalQuizID) {
                        $q->where('personalQuizID', $personalQuizID);
                    });
                }
                
                // Filter by student if provided
                if ($request->has('studentID')) {
                    $query->where('studentID', $request->input('studentID'));
                }
            } else {
                return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
            }

            // Filter by class quiz assignment if provided
            if ($request->has('class_quiz_assignment_id')) {
                $query->where('class_quiz_assignment_id', $request->input('class_quiz_assignment_id'));
            }

            // Order by most recent first
            $results = $query->orderByDesc('submitted_at')
                ->orderByDesc('created_at')
                ->get();

            return response()->json([
                'success' => true,
                'message' => 'Quiz results retrieved successfully.',
                'results' => $results,
                'total' => $results->count(),
            ], 200);
        } catch (\Throwable $e) {
            Log::error('Error retrieving quiz results', [
                'user_id' => optional(Auth::user())->userID,
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An error occurred while retrieving quiz results.',
                'error' => app()->environment('local') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Get a specific quiz result.
     */
    public function show($id)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return response()->json(['success' => false, 'message' => 'Unauthorized'], 401);
            }

            $result = StudentQuizResult::with(['classQuizAssignment.personalQuiz', 'classQuizAssignment.class', 'student'])
                ->find($id);

            if (!$result) {
                return response()->json(['success' => false, 'message' => 'Quiz result not found.'], 404);
            }

            // Students can only see their own results
            if ($user->roleID == 1 && $result->studentID !== $user->userID) {
                return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
            }

            // Faculty can see results for their classes
            if (in_array($user->roleID, [2, 3, 4, 5])) {
                // Verify the class belongs to the faculty member
                $classQuizAssignment = $result->classQuizAssignment;
                if ($classQuizAssignment && $classQuizAssignment->class) {
                    if ($classQuizAssignment->class->created_by !== $user->userID && !in_array($user->roleID, [3, 4, 5])) {
                        return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
                    }
                }
            }

            return response()->json([
                'success' => true,
                'message' => 'Quiz result retrieved successfully.',
                'result' => $result,
            ], 200);
        } catch (\Throwable $e) {
            Log::error('Error retrieving quiz result', [
                'user_id' => optional(Auth::user())->userID,
                'result_id' => $id,
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An error occurred while retrieving the quiz result.',
                'error' => app()->environment('local') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Create a new quiz result.
     * Typically called when a student submits a quiz.
     */
    public function store(Request $request)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return response()->json(['success' => false, 'message' => 'Unauthorized'], 401);
            }

            // Only students can create their own results
            if ($user->roleID != 1) {
                return response()->json(['success' => false, 'message' => 'Only students can submit quiz results.'], 403);
            }

            try {
                $validated = $request->validate([
                    'class_quiz_assignment_id' => 'required|integer|exists:class_personal_quizzes,classPersonalQuizID',
                    'score' => 'required|numeric|min:0',
                    'total_score' => 'required|numeric|min:0',
                    'percentage' => 'required|numeric|min:0|max:100',
                    'attempt_number' => 'required|integer|min:1',
                    'started_at' => 'nullable|date',
                    'submitted_at' => 'nullable|date',
                    'time_taken_seconds' => 'nullable|integer|min:0',
                    'isRecorded' => 'nullable|boolean',
                    'isPassed' => 'nullable|boolean',
                ]);
            } catch (ValidationException $e) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $e->errors(),
                ], 422);
            }

            // Verify student is enrolled in the class
            $classQuizAssignment = ClassPersonalQuiz::with('class')->find($validated['class_quiz_assignment_id']);
            if (!$classQuizAssignment) {
                return response()->json(['success' => false, 'message' => 'Class quiz assignment not found.'], 404);
            }

            $enrollment = ClassEnrollment::where('classID', $classQuizAssignment->classID)
                ->where('studentID', $user->userID)
                ->first();

            if (!$enrollment) {
                return response()->json(['success' => false, 'message' => 'You are not enrolled in this class.'], 403);
            }

            // Verify attempt number doesn't already exist
            $existingResult = StudentQuizResult::where('class_quiz_assignment_id', $validated['class_quiz_assignment_id'])
                ->where('studentID', $user->userID)
                ->where('attempt_number', $validated['attempt_number'])
                ->first();

            if ($existingResult) {
                return response()->json([
                    'success' => false,
                    'message' => 'A result for this attempt number already exists.',
                ], 422);
            }

            // Set studentID to current user
            $validated['studentID'] = $user->userID;

            // Set timestamps if not provided
            if (!isset($validated['submitted_at'])) {
                $validated['submitted_at'] = now();
            }
            if (!isset($validated['started_at']) && isset($validated['time_taken_seconds'])) {
                $validated['started_at'] = now()->subSeconds($validated['time_taken_seconds']);
            }

            $result = StudentQuizResult::create($validated);
            $result->load(['classQuizAssignment.personalQuiz', 'classQuizAssignment.class', 'student']);

            return response()->json([
                'success' => true,
                'message' => 'Quiz result saved successfully.',
                'result' => $result,
            ], 201);
        } catch (\Throwable $e) {
            Log::error('Error creating quiz result', [
                'user_id' => optional(Auth::user())->userID,
                'payload' => $request->all(),
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An internal error occurred while saving the quiz result.',
                'error' => app()->environment('local') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Update a quiz result.
     * Typically used by faculty to mark results or update status.
     */
    public function update(Request $request, $id)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return response()->json(['success' => false, 'message' => 'Unauthorized'], 401);
            }

            $result = StudentQuizResult::with('classQuizAssignment.class')->find($id);
            if (!$result) {
                return response()->json(['success' => false, 'message' => 'Quiz result not found.'], 404);
            }

            // Students can only update their own results (limited fields)
            if ($user->roleID == 1) {
                if ($result->studentID !== $user->userID) {
                    return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
                }
                // Students can only update certain fields
                try {
                    $validated = $request->validate([
                        'isRecorded' => 'nullable|boolean',
                    ]);
                } catch (ValidationException $e) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Validation failed',
                        'errors' => $e->errors(),
                    ], 422);
                }
            } 
            // Faculty can update results for their classes
            elseif (in_array($user->roleID, [2, 3, 4, 5])) {
                // Verify the class belongs to the faculty member
                $classQuizAssignment = $result->classQuizAssignment;
                if ($classQuizAssignment && $classQuizAssignment->class) {
                    if ($classQuizAssignment->class->created_by !== $user->userID && !in_array($user->roleID, [3, 4, 5])) {
                        return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
                    }
                }

                try {
                    $validated = $request->validate([
                        'score' => 'sometimes|numeric|min:0',
                        'total_score' => 'sometimes|numeric|min:0',
                        'percentage' => 'sometimes|numeric|min:0|max:100',
                        'isRecorded' => 'nullable|boolean',
                        'isPassed' => 'nullable|boolean',
                    ]);
                } catch (ValidationException $e) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Validation failed',
                        'errors' => $e->errors(),
                    ], 422);
                }
            } else {
                return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
            }

            $result->update($validated);
            $result->load(['classQuizAssignment.personalQuiz', 'classQuizAssignment.class', 'student']);

            return response()->json([
                'success' => true,
                'message' => 'Quiz result updated successfully.',
                'result' => $result,
            ], 200);
        } catch (\Throwable $e) {
            Log::error('Error updating quiz result', [
                'user_id' => optional(Auth::user())->userID,
                'result_id' => $id,
                'payload' => $request->all(),
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An internal error occurred while updating the quiz result.',
                'error' => app()->environment('local') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Get student's quiz history for a class.
     * Shows highest attempt by default, but includes all attempts.
     * Results are sorted by quiz.
     */
    public function classHistory($classID)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return response()->json(['success' => false, 'message' => 'Unauthorized'], 401);
            }

            if ($user->roleID != 1) {
                return response()->json(['success' => false, 'message' => 'Only students can view their class history.'], 403);
            }

            // Verify student is enrolled
            $enrollment = ClassEnrollment::where('classID', $classID)
                ->where('studentID', $user->userID)
                ->first();

            if (!$enrollment) {
                return response()->json(['success' => false, 'message' => 'You are not enrolled in this class.'], 403);
            }

            // Get all quiz assignments for this class
            $quizAssignments = ClassPersonalQuiz::with(['personalQuiz.subject', 'personalQuiz.quizType'])
                ->where('classID', $classID)
                ->get();

            // Get all results for this student in this class
            $allResults = StudentQuizResult::with(['classQuizAssignment.personalQuiz.subject', 'classQuizAssignment.personalQuiz.quizType'])
                ->whereHas('classQuizAssignment', function($q) use ($classID) {
                    $q->where('classID', $classID);
                })
                ->where('studentID', $user->userID)
                ->orderBy('submitted_at', 'desc')
                ->get();

            // Group results by quiz assignment
            $groupedResults = [];
            foreach ($quizAssignments as $assignment) {
                $quizResults = $allResults->where('class_quiz_assignment_id', $assignment->classPersonalQuizID);
                
                if ($quizResults->isEmpty()) {
                    continue; // Skip quizzes with no attempts
                }

                // Find highest attempt (by percentage, then by score)
                $highestAttempt = $quizResults->sortByDesc(function($result) {
                    return [$result->percentage, $result->score];
                })->first();

                // Get all attempts sorted by attempt number
                $allAttempts = $quizResults->sortBy('attempt_number')->values();

                $groupedResults[] = [
                    'classPersonalQuizID' => $assignment->classPersonalQuizID,
                    'quiz' => [
                        'personalQuizID' => $assignment->personalQuiz->personalQuizID,
                        'title' => $assignment->personalQuiz->title,
                        'description' => $assignment->personalQuiz->description,
                        'subject' => $assignment->personalQuiz->subject ? [
                            'subjectID' => $assignment->personalQuiz->subject->subjectID,
                            'subjectCode' => $assignment->personalQuiz->subject->subjectCode,
                            'subjectName' => $assignment->personalQuiz->subject->subjectName,
                        ] : null,
                        'quizType' => $assignment->personalQuiz->quizType ? [
                            'id' => $assignment->personalQuiz->quizType->id,
                            'name' => $assignment->personalQuiz->quizType->name,
                        ] : null,
                    ],
                    'assignment' => [
                        'startDate' => $assignment->startDate,
                        'deadlineDate' => $assignment->deadlineDate,
                    ],
                    'highestAttempt' => [
                        'id' => $highestAttempt->id,
                        'score' => $highestAttempt->score,
                        'total_score' => $highestAttempt->total_score,
                        'percentage' => $highestAttempt->percentage,
                        'isPassed' => $highestAttempt->isPassed,
                        'attempt_number' => $highestAttempt->attempt_number,
                        'time_taken_seconds' => $highestAttempt->time_taken_seconds,
                        'time_taken_minutes' => $highestAttempt->time_taken_seconds ? round($highestAttempt->time_taken_seconds / 60, 2) : null,
                        'submitted_at' => $highestAttempt->submitted_at,
                    ],
                    'allAttempts' => $allAttempts->map(function($result) {
                        return [
                            'id' => $result->id,
                            'score' => $result->score,
                            'total_score' => $result->total_score,
                            'percentage' => $result->percentage,
                            'isPassed' => $result->isPassed,
                            'attempt_number' => $result->attempt_number,
                            'time_taken_seconds' => $result->time_taken_seconds,
                            'time_taken_minutes' => $result->time_taken_seconds ? round($result->time_taken_seconds / 60, 2) : null,
                            'submitted_at' => $result->submitted_at,
                            'started_at' => $result->started_at,
                        ];
                    }),
                    'totalAttempts' => $allAttempts->count(),
                ];
            }

            // Sort by quiz title
            usort($groupedResults, function($a, $b) {
                return strcmp($a['quiz']['title'], $b['quiz']['title']);
            });

            return response()->json([
                'success' => true,
                'message' => 'Class quiz history retrieved successfully.',
                'history' => $groupedResults,
                'total' => count($groupedResults),
            ], 200);
        } catch (\Throwable $e) {
            Log::error('Error retrieving class history', [
                'user_id' => optional(Auth::user())->userID,
                'class_id' => $classID,
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An error occurred while retrieving class history.',
                'error' => app()->environment('local') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Get student's history for a specific quiz.
     */
    public function quizHistory($classPersonalQuizID)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return response()->json(['success' => false, 'message' => 'Unauthorized'], 401);
            }

            if ($user->roleID != 1) {
                return response()->json(['success' => false, 'message' => 'Only students can view their quiz history.'], 403);
            }

            // Get class quiz assignment
            $classQuizAssignment = ClassPersonalQuiz::with(['personalQuiz.subject', 'personalQuiz.quizType', 'class'])
                ->find($classPersonalQuizID);

            if (!$classQuizAssignment) {
                return response()->json(['success' => false, 'message' => 'Quiz assignment not found.'], 404);
            }

            // Verify student is enrolled
            $enrollment = ClassEnrollment::where('classID', $classQuizAssignment->classID)
                ->where('studentID', $user->userID)
                ->first();

            if (!$enrollment) {
                return response()->json(['success' => false, 'message' => 'You are not enrolled in this class.'], 403);
            }

            // Get all results for this student and quiz
            $results = StudentQuizResult::where('class_quiz_assignment_id', $classPersonalQuizID)
                ->where('studentID', $user->userID)
                ->orderBy('attempt_number', 'asc')
                ->get();

            // Find highest attempt
            $highestAttempt = $results->sortByDesc(function($result) {
                return [$result->percentage, $result->score];
            })->first();

            return response()->json([
                'success' => true,
                'message' => 'Quiz history retrieved successfully.',
                'quiz' => [
                    'personalQuizID' => $classQuizAssignment->personalQuiz->personalQuizID,
                    'title' => $classQuizAssignment->personalQuiz->title,
                    'description' => $classQuizAssignment->personalQuiz->description,
                    'subject' => $classQuizAssignment->personalQuiz->subject ? [
                        'subjectID' => $classQuizAssignment->personalQuiz->subject->subjectID,
                        'subjectCode' => $classQuizAssignment->personalQuiz->subject->subjectCode,
                        'subjectName' => $classQuizAssignment->personalQuiz->subject->subjectName,
                    ] : null,
                ],
                'assignment' => [
                    'startDate' => $classQuizAssignment->startDate,
                    'deadlineDate' => $classQuizAssignment->deadlineDate,
                ],
                'highestAttempt' => $highestAttempt ? [
                    'id' => $highestAttempt->id,
                    'score' => $highestAttempt->score,
                    'total_score' => $highestAttempt->total_score,
                    'percentage' => $highestAttempt->percentage,
                    'isPassed' => $highestAttempt->isPassed,
                    'attempt_number' => $highestAttempt->attempt_number,
                    'time_taken_seconds' => $highestAttempt->time_taken_seconds,
                    'time_taken_minutes' => $highestAttempt->time_taken_seconds ? round($highestAttempt->time_taken_seconds / 60, 2) : null,
                    'submitted_at' => $highestAttempt->submitted_at,
                ] : null,
                'allAttempts' => $results->map(function($result) {
                    return [
                        'id' => $result->id,
                        'score' => $result->score,
                        'total_score' => $result->total_score,
                        'percentage' => $result->percentage,
                        'isPassed' => $result->isPassed,
                        'attempt_number' => $result->attempt_number,
                        'time_taken_seconds' => $result->time_taken_seconds,
                        'time_taken_minutes' => $result->time_taken_seconds ? round($result->time_taken_seconds / 60, 2) : null,
                        'submitted_at' => $result->submitted_at,
                        'started_at' => $result->started_at,
                    ];
                }),
                'totalAttempts' => $results->count(),
            ], 200);
        } catch (\Throwable $e) {
            Log::error('Error retrieving quiz history', [
                'user_id' => optional(Auth::user())->userID,
                'class_quiz_assignment_id' => $classPersonalQuizID,
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An error occurred while retrieving quiz history.',
                'error' => app()->environment('local') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Get all quiz results for a class (Faculty view).
     * Results are sorted by quiz and include student names.
     */
    public function classResults($classID)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return response()->json(['success' => false, 'message' => 'Unauthorized'], 401);
            }

            if (!in_array($user->roleID, [2, 3, 4, 5])) {
                return response()->json(['success' => false, 'message' => 'Only faculty can view class results.'], 403);
            }

            // Verify the class belongs to the faculty member
            $class = ClassModel::where('classID', $classID)
                ->first();

            if (!$class) {
                return response()->json(['success' => false, 'message' => 'Class not found.'], 404);
            }

            if ($class->facultyID !== $user->userID && !in_array($user->roleID, [3, 4, 5])) {
                return response()->json(['success' => false, 'message' => 'You do not have permission to view this class.'], 403);
            }

            // Get all quiz assignments for this class
            $quizAssignments = ClassPersonalQuiz::with(['personalQuiz.subject', 'personalQuiz.quizType'])
                ->where('classID', $classID)
                ->get();

            // Get all results for this class
            $allResults = StudentQuizResult::with(['classQuizAssignment.personalQuiz', 'student'])
                ->whereHas('classQuizAssignment', function($q) use ($classID) {
                    $q->where('classID', $classID);
                })
                ->orderBy('submitted_at', 'desc')
                ->get();

            // Group results by quiz assignment
            $groupedResults = [];
            foreach ($quizAssignments as $assignment) {
                $quizResults = $allResults->where('class_quiz_assignment_id', $assignment->classPersonalQuizID);
                
                // Group by student
                $studentResults = [];
                foreach ($quizResults->groupBy('studentID') as $studentID => $results) {
                    $student = $results->first()->student;
                    $highestAttempt = $results->sortByDesc(function($result) {
                        return [$result->percentage, $result->score];
                    })->first();

                    $studentResults[] = [
                        'student' => [
                            'userID' => $student->userID,
                            'userCode' => $student->userCode,
                            'firstName' => $student->firstName,
                            'lastName' => $student->lastName,
                            'email' => $student->email,
                        ],
                        'highestAttempt' => [
                            'id' => $highestAttempt->id,
                            'score' => $highestAttempt->score,
                            'total_score' => $highestAttempt->total_score,
                            'percentage' => $highestAttempt->percentage,
                            'isPassed' => $highestAttempt->isPassed,
                            'attempt_number' => $highestAttempt->attempt_number,
                            'time_taken_seconds' => $highestAttempt->time_taken_seconds,
                            'time_taken_minutes' => $highestAttempt->time_taken_seconds ? round($highestAttempt->time_taken_seconds / 60, 2) : null,
                            'submitted_at' => $highestAttempt->submitted_at,
                        ],
                        'allAttempts' => $results->sortBy('attempt_number')->map(function($result) {
                            return [
                                'id' => $result->id,
                                'score' => $result->score,
                                'total_score' => $result->total_score,
                                'percentage' => $result->percentage,
                                'isPassed' => $result->isPassed,
                                'attempt_number' => $result->attempt_number,
                                'time_taken_seconds' => $result->time_taken_seconds,
                                'time_taken_minutes' => $result->time_taken_seconds ? round($result->time_taken_seconds / 60, 2) : null,
                                'submitted_at' => $result->submitted_at,
                                'started_at' => $result->started_at,
                            ];
                        })->values(),
                        'totalAttempts' => $results->count(),
                    ];
                }

                // Sort students by last name, then first name
                usort($studentResults, function($a, $b) {
                    $nameA = $a['student']['lastName'] . ' ' . $a['student']['firstName'];
                    $nameB = $b['student']['lastName'] . ' ' . $b['student']['firstName'];
                    return strcmp($nameA, $nameB);
                });

                $groupedResults[] = [
                    'classPersonalQuizID' => $assignment->classPersonalQuizID,
                    'quiz' => [
                        'personalQuizID' => $assignment->personalQuiz->personalQuizID,
                        'title' => $assignment->personalQuiz->title,
                        'description' => $assignment->personalQuiz->description,
                        'subject' => $assignment->personalQuiz->subject ? [
                            'subjectID' => $assignment->personalQuiz->subject->subjectID,
                            'subjectCode' => $assignment->personalQuiz->subject->subjectCode,
                            'subjectName' => $assignment->personalQuiz->subject->subjectName,
                        ] : null,
                        'quizType' => $assignment->personalQuiz->quizType ? [
                            'id' => $assignment->personalQuiz->quizType->id,
                            'name' => $assignment->personalQuiz->quizType->name,
                        ] : null,
                    ],
                    'assignment' => [
                        'startDate' => $assignment->startDate,
                        'deadlineDate' => $assignment->deadlineDate,
                    ],
                    'students' => $studentResults,
                    'totalStudents' => count($studentResults),
                ];
            }

            // Sort by quiz title
            usort($groupedResults, function($a, $b) {
                return strcmp($a['quiz']['title'], $b['quiz']['title']);
            });

            return response()->json([
                'success' => true,
                'message' => 'Class quiz results retrieved successfully.',
                'results' => $groupedResults,
                'total' => count($groupedResults),
            ], 200);
        } catch (\Throwable $e) {
            Log::error('Error retrieving class results', [
                'user_id' => optional(Auth::user())->userID,
                'class_id' => $classID,
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An error occurred while retrieving class results.',
                'error' => app()->environment('local') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Get all results for a specific quiz (Faculty view).
     */
    public function quizResults($classPersonalQuizID)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return response()->json(['success' => false, 'message' => 'Unauthorized'], 401);
            }

            if (!in_array($user->roleID, [2, 3, 4, 5])) {
                return response()->json(['success' => false, 'message' => 'Only faculty can view quiz results.'], 403);
            }

            // Get class quiz assignment
            $classQuizAssignment = ClassPersonalQuiz::with(['personalQuiz.subject', 'personalQuiz.quizType', 'class'])
                ->find($classPersonalQuizID);

            if (!$classQuizAssignment) {
                return response()->json(['success' => false, 'message' => 'Quiz assignment not found.'], 404);
            }

            // Verify the class belongs to the faculty member
            if ($classQuizAssignment->class->facultyID !== $user->userID && !in_array($user->roleID, [3, 4, 5])) {
                return response()->json(['success' => false, 'message' => 'You do not have permission to view this quiz.'], 403);
            }

            // Get all results for this quiz
            $results = StudentQuizResult::with('student')
                ->where('class_quiz_assignment_id', $classPersonalQuizID)
                ->orderBy('submitted_at', 'desc')
                ->get();

            // Group by student
            $studentResults = [];
            foreach ($results->groupBy('studentID') as $studentID => $studentResultsList) {
                $student = $studentResultsList->first()->student;
                $highestAttempt = $studentResultsList->sortByDesc(function($result) {
                    return [$result->percentage, $result->score];
                })->first();

                $studentResults[] = [
                    'student' => [
                        'userID' => $student->userID,
                        'userCode' => $student->userCode,
                        'firstName' => $student->firstName,
                        'lastName' => $student->lastName,
                        'email' => $student->email,
                    ],
                    'highestAttempt' => [
                        'id' => $highestAttempt->id,
                        'score' => $highestAttempt->score,
                        'total_score' => $highestAttempt->total_score,
                        'percentage' => $highestAttempt->percentage,
                        'isPassed' => $highestAttempt->isPassed,
                        'attempt_number' => $highestAttempt->attempt_number,
                        'time_taken_seconds' => $highestAttempt->time_taken_seconds,
                        'time_taken_minutes' => $highestAttempt->time_taken_seconds ? round($highestAttempt->time_taken_seconds / 60, 2) : null,
                        'submitted_at' => $highestAttempt->submitted_at,
                    ],
                    'allAttempts' => $studentResultsList->sortBy('attempt_number')->map(function($result) {
                        return [
                            'id' => $result->id,
                            'score' => $result->score,
                            'total_score' => $result->total_score,
                            'percentage' => $result->percentage,
                            'isPassed' => $result->isPassed,
                            'attempt_number' => $result->attempt_number,
                            'time_taken_seconds' => $result->time_taken_seconds,
                            'time_taken_minutes' => $result->time_taken_seconds ? round($result->time_taken_seconds / 60, 2) : null,
                            'submitted_at' => $result->submitted_at,
                            'started_at' => $result->started_at,
                        ];
                    })->values(),
                    'totalAttempts' => $studentResultsList->count(),
                ];
            }

            // Sort students by last name, then first name
            usort($studentResults, function($a, $b) {
                $nameA = $a['student']['lastName'] . ' ' . $a['student']['firstName'];
                $nameB = $b['student']['lastName'] . ' ' . $b['student']['firstName'];
                return strcmp($nameA, $nameB);
            });

            return response()->json([
                'success' => true,
                'message' => 'Quiz results retrieved successfully.',
                'quiz' => [
                    'personalQuizID' => $classQuizAssignment->personalQuiz->personalQuizID,
                    'title' => $classQuizAssignment->personalQuiz->title,
                    'description' => $classQuizAssignment->personalQuiz->description,
                    'subject' => $classQuizAssignment->personalQuiz->subject ? [
                        'subjectID' => $classQuizAssignment->personalQuiz->subject->subjectID,
                        'subjectCode' => $classQuizAssignment->personalQuiz->subject->subjectCode,
                        'subjectName' => $classQuizAssignment->personalQuiz->subject->subjectName,
                    ] : null,
                ],
                'assignment' => [
                    'startDate' => $classQuizAssignment->startDate,
                    'deadlineDate' => $classQuizAssignment->deadlineDate,
                ],
                'students' => $studentResults,
                'totalStudents' => count($studentResults),
            ], 200);
        } catch (\Throwable $e) {
            Log::error('Error retrieving quiz results', [
                'user_id' => optional(Auth::user())->userID,
                'class_quiz_assignment_id' => $classPersonalQuizID,
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An error occurred while retrieving quiz results.',
                'error' => app()->environment('local') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Get students who haven't taken the quiz or submitted late (Faculty view).
     */
    public function quizNonTakers($classPersonalQuizID)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return response()->json(['success' => false, 'message' => 'Unauthorized'], 401);
            }

            if (!in_array($user->roleID, [2, 3, 4, 5])) {
                return response()->json(['success' => false, 'message' => 'Only faculty can view non-takers.'], 403);
            }

            // Get class quiz assignment (include per-class settings)
            $classQuizAssignment = ClassPersonalQuiz::with(['setting', 'personalQuiz', 'class'])
                ->find($classPersonalQuizID);

            if (!$classQuizAssignment) {
                return response()->json(['success' => false, 'message' => 'Quiz assignment not found.'], 404);
            }

            // Verify the class belongs to the faculty member
            if ($classQuizAssignment->class->facultyID !== $user->userID && !in_array($user->roleID, [3, 4, 5])) {
                return response()->json(['success' => false, 'message' => 'You do not have permission to view this quiz.'], 403);
            }

            // Get all enrolled students
            $enrolledStudents = ClassEnrollment::with('student')
                ->where('classID', $classQuizAssignment->classID)
                ->get();

            // Get all students who have taken the quiz
            $takers = StudentQuizResult::where('class_quiz_assignment_id', $classPersonalQuizID)
                ->pluck('studentID')
                ->unique()
                ->toArray();

            // Get quiz settings to check for late submission
            $settings = $classQuizAssignment->setting;
            $now = now();
            $isPastDeadline = false;
            if ($classQuizAssignment->deadlineDate) {
                $isPastDeadline = $now > $classQuizAssignment->deadlineDate;
            }

            // Categorize students
            $nonTakers = [];
            $lateSubmitters = [];

            foreach ($enrolledStudents as $enrollment) {
                $student = $enrollment->student;
                $hasTaken = in_array($student->userID, $takers);

                if (!$hasTaken) {
                    $nonTakers[] = [
                        'student' => [
                            'userID' => $student->userID,
                            'userCode' => $student->userCode,
                            'firstName' => $student->firstName,
                            'lastName' => $student->lastName,
                            'email' => $student->email,
                        ],
                        'status' => 'not_taken',
                        'enrolledAt' => $enrollment->enrolledAt,
                    ];
                } else {
                    // Check if they submitted late
                    $latestResult = StudentQuizResult::where('class_quiz_assignment_id', $classPersonalQuizID)
                        ->where('studentID', $student->userID)
                        ->orderByDesc('submitted_at')
                        ->first();

                    if ($latestResult && $classQuizAssignment->deadlineDate && $latestResult->submitted_at > $classQuizAssignment->deadlineDate) {
                        $lateSubmitters[] = [
                            'student' => [
                                'userID' => $student->userID,
                                'userCode' => $student->userCode,
                                'firstName' => $student->firstName,
                                'lastName' => $student->lastName,
                                'email' => $student->email,
                            ],
                            'status' => 'late',
                            'latestResult' => [
                                'id' => $latestResult->id,
                                'score' => $latestResult->score,
                                'total_score' => $latestResult->total_score,
                                'percentage' => $latestResult->percentage,
                                'attempt_number' => $latestResult->attempt_number,
                                'submitted_at' => $latestResult->submitted_at,
                                'deadlineDate' => $classQuizAssignment->deadlineDate,
                                'daysLate' => $classQuizAssignment->deadlineDate->diffInDays($latestResult->submitted_at),
                            ],
                        ];
                    }
                }
            }

            // Sort by last name, then first name
            usort($nonTakers, function($a, $b) {
                $nameA = $a['student']['lastName'] . ' ' . $a['student']['firstName'];
                $nameB = $b['student']['lastName'] . ' ' . $b['student']['firstName'];
                return strcmp($nameA, $nameB);
            });

            usort($lateSubmitters, function($a, $b) {
                $nameA = $a['student']['lastName'] . ' ' . $a['student']['firstName'];
                $nameB = $b['student']['lastName'] . ' ' . $b['student']['firstName'];
                return strcmp($nameA, $nameB);
            });

            return response()->json([
                'success' => true,
                'message' => 'Non-takers and late submitters retrieved successfully.',
                'quiz' => [
                    'personalQuizID' => $classQuizAssignment->personalQuiz->personalQuizID,
                    'title' => $classQuizAssignment->personalQuiz->title,
                    'deadlineDate' => $classQuizAssignment->deadlineDate,
                    'isPastDeadline' => $isPastDeadline,
                ],
                'nonTakers' => $nonTakers,
                'lateSubmitters' => $lateSubmitters,
                'totalNonTakers' => count($nonTakers),
                'totalLateSubmitters' => count($lateSubmitters),
            ], 200);
        } catch (\Throwable $e) {
            Log::error('Error retrieving non-takers', [
                'user_id' => optional(Auth::user())->userID,
                'class_quiz_assignment_id' => $classPersonalQuizID,
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An error occurred while retrieving non-takers.',
                'error' => app()->environment('local') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Delete a quiz result.
     * Only accessible by faculty/admins.
     */
    public function destroy($id)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return response()->json(['success' => false, 'message' => 'Unauthorized'], 401);
            }

            // Only faculty/admins can delete results
            if (!in_array($user->roleID, [2, 3, 4, 5])) {
                return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
            }

            $result = StudentQuizResult::with('classQuizAssignment.class')->find($id);
            if (!$result) {
                return response()->json(['success' => false, 'message' => 'Quiz result not found.'], 404);
            }

            // Verify the class belongs to the faculty member
            $classQuizAssignment = $result->classQuizAssignment;
            if ($classQuizAssignment && $classQuizAssignment->class) {
                if ($classQuizAssignment->class->created_by !== $user->userID && !in_array($user->roleID, [3, 4, 5])) {
                    return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
                }
            }

            $result->delete();

            return response()->json([
                'success' => true,
                'message' => 'Quiz result deleted successfully.',
            ], 200);
        } catch (\Throwable $e) {
            Log::error('Error deleting quiz result', [
                'user_id' => optional(Auth::user())->userID,
                'result_id' => $id,
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An internal error occurred while deleting the quiz result.',
                'error' => app()->environment('local') ? $e->getMessage() : null,
            ], 500);
        }
    }
}



