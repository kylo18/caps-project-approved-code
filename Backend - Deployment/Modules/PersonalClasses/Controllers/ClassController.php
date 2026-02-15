<?php

namespace Modules\PersonalClasses\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Modules\PersonalClasses\Models\ClassModel;
use Modules\PersonalClasses\Models\ClassEnrollment;
use Modules\PersonalClasses\Models\ClassPersonalQuiz;
use Modules\PersonalClasses\Models\ClassQuizAttempt;

class ClassController extends Controller
{
    /**
     * List all classes created by the authenticated faculty.
     */
    public function index()
    {
        try {
            $user = Auth::user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized',
                ], 401);
            }

            $classes = ClassModel::with(['subject', 'faculty', 'enrollments.student'])
                ->where('facultyID', $user->userID)
                ->where('isActive', true) // Only return non-archived classes
                ->orderByDesc('created_at')
                ->get();

            return response()->json([
                'success' => true,
                'message' => 'Classes retrieved successfully.',
                'classes' => $classes,
                'total' => $classes->count(),
            ], 200);
        } catch (\Throwable $e) {
            Log::error('Error listing classes', [
                'user_id' => optional(Auth::user())->userID,
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An error occurred while retrieving classes.',
                'error' => app()->environment('local') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Create a new class.
     */
    public function store(Request $request)
    {
        try {
            $user = Auth::user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized',
                ], 401);
            }

            try {
                $validated = $request->validate([
                    'className' => 'required|string|max:255',
                    'subjectID' => 'required|exists:subjects,subjectID',
                    'description' => 'nullable|string',
                    'schedule' => 'nullable|string',
                    'isActive' => 'sometimes|boolean',
                ]);
            } catch (ValidationException $e) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $e->errors(),
                ], 422);
            }

            // Generate unique class code (6 characters, alphanumeric)
            $classCode = $this->generateUniqueClassCode();

            // Generate unique invite link token
            $inviteToken = $this->generateUniqueInviteToken();
            $inviteLink = url('/api/classes/join/' . $inviteToken);

            $class = ClassModel::create([
                'facultyID' => $user->userID,
                'subjectID' => $validated['subjectID'],
                'className' => $validated['className'],
                'classCode' => $classCode,
                'inviteToken' => $inviteToken,
                'inviteLink' => $inviteLink,
                'description' => $validated['description'] ?? null,
                'schedule' => $validated['schedule'] ?? null,
                'isActive' => $validated['isActive'] ?? true,
            ]);

            // Load relationships
            $class->load(['subject', 'faculty']);

            return response()->json([
                'success' => true,
                'message' => 'Class created successfully.',
                'class' => $class,
            ], 201);
        } catch (\Throwable $e) {
            Log::error('Error creating class', [
                'user_id' => optional(Auth::user())->userID,
                'payload' => $request->all(),
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An internal error occurred while creating the class.',
                'error' => app()->environment('local') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Show a specific class with students and quizzes.
     */
    public function show($classID)
    {
        try {
            $user = Auth::user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized',
                ], 401);
            }

            $class = ClassModel::with([
                'subject',
                'faculty',
                'enrollments.student.program',
            ])
                ->where('classID', $classID)
                ->where('facultyID', $user->userID)
                ->first();

            if (!$class) {
                return response()->json([
                    'success' => false,
                    'message' => 'Class not found.',
                ], 404);
            }

            // Format students with statistics
            $students = $class->enrollments->map(function ($enrollment) use ($classID) {
                $student = $enrollment->student;
                
                // Get all quiz attempts for this student in this class
                $attempts = ClassQuizAttempt::where('classID', $classID)
                    ->where('studentID', $student->userID)
                    ->get();

                $totalQuizzes = ClassPersonalQuiz::where('classID', $classID)->count();
                $completedQuizzes = $attempts->where('isCompleted', true)->count();
                $completedPercentage = $totalQuizzes > 0 
                    ? round(($completedQuizzes / $totalQuizzes) * 100, 2) 
                    : 0;

                $averageAccuracy = $attempts->where('isCompleted', true)->count() > 0
                    ? round($attempts->where('isCompleted', true)->avg('accuracy'), 2)
                    : 0;

                return [
                    'enrollmentID' => $enrollment->enrollmentID,
                    'studentID' => $student->userID,
                    'name' => $student->firstName . ' ' . $student->lastName,
                    'program' => $student->program ? $student->program->programName : 'N/A',
                    'averageAccuracy' => $averageAccuracy,
                    'quizzesAnswered' => $attempts->count(),
                    'completedQuizzes' => $completedPercentage,
                    'enrolledAt' => $enrollment->enrolledAt,
                ];
            });

            // Format quizzes with statistics
            // Use ClassPersonalQuiz model to get pivot data properly
            $classPersonalQuizzes = ClassPersonalQuiz::where('classID', $classID)
                ->with('personalQuiz')
                ->get();

            $quizzes = $classPersonalQuizzes->map(function ($classPersonalQuiz) use ($classID) {
                $quiz = $classPersonalQuiz->personalQuiz;
                
                if (!$quiz) {
                    return null;
                }
                
                // Get all students who answered this quiz
                $attempts = ClassQuizAttempt::where('classID', $classID)
                    ->where('personalQuizID', $quiz->personalQuizID)
                    ->with('student')
                    ->get();

                $studentsAnswered = $attempts->map(function ($attempt) {
                    return [
                        'studentID' => $attempt->studentID,
                        'name' => $attempt->student->firstName . ' ' . $attempt->student->lastName,
                        'score' => $attempt->score,
                        'accuracy' => $attempt->accuracy,
                        'isCompleted' => $attempt->isCompleted,
                        'completedAt' => $attempt->completedAt,
                    ];
                });

                $averageAccuracy = $attempts->where('isCompleted', true)->count() > 0
                    ? round($attempts->where('isCompleted', true)->avg('accuracy'), 2)
                    : 0;

                return [
                    'classPersonalQuizID' => $classPersonalQuiz->classPersonalQuizID,
                    'personalQuizID' => $quiz->personalQuizID,
                    'quizName' => $quiz->title,
                    'studentsAnswered' => $studentsAnswered,
                    'startDate' => $classPersonalQuiz->startDate,
                    'deadlineDate' => $classPersonalQuiz->deadlineDate,
                    'accuracy' => $averageAccuracy,
                ];
            })->filter(); // Remove null entries

            return response()->json([
                'success' => true,
                'message' => 'Class retrieved successfully.',
                // Backward/forward compatibility: some frontends may read subject data from the top-level response
                // instead of unwrapping the `class` key first.
                'subjectID' => $class->subjectID,
                'subject' => $class->subject,
                'class' => [
                    'classID' => $class->classID,
                    'className' => $class->className,
                    'classCode' => $class->classCode,
                    'inviteLink' => $class->inviteLink,
                    'description' => $class->description,
                    'schedule' => $class->schedule,
                    'isActive' => $class->isActive,
                    'subjectID' => $class->subjectID,
                    'subject' => $class->subject,
                    'faculty' => $class->faculty,
                    'students' => $students,
                    'quizzes' => $quizzes,
                    'created_at' => $class->created_at,
                    'updated_at' => $class->updated_at,
                ],
            ], 200);
        } catch (\Throwable $e) {
            Log::error('Error retrieving class', [
                'user_id' => optional(Auth::user())->userID,
                'class_id' => $classID,
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An error occurred while retrieving the class.',
                'error' => app()->environment('local') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Update a class.
     */
    public function update(Request $request, $classID)
    {
        try {
            $user = Auth::user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized',
                ], 401);
            }

            $class = ClassModel::where('classID', $classID)
                ->where('facultyID', $user->userID)
                ->first();

            if (!$class) {
                return response()->json([
                    'success' => false,
                    'message' => 'Class not found.',
                ], 404);
            }

            try {
                $validated = $request->validate([
                    'className' => 'sometimes|required|string|max:255',
                    'subjectID' => 'sometimes|required|exists:subjects,subjectID',
                    'description' => 'nullable|string',
                    'schedule' => 'nullable|string',
                    'isActive' => 'sometimes|boolean',
                ]);
            } catch (ValidationException $e) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $e->errors(),
                ], 422);
            }

            $class->update($validated);
            $class->load(['subject', 'faculty']);

            return response()->json([
                'success' => true,
                'message' => 'Class updated successfully.',
                'class' => $class,
            ], 200);
        } catch (\Throwable $e) {
            Log::error('Error updating class', [
                'user_id' => optional(Auth::user())->userID,
                'class_id' => $classID,
                'payload' => $request->all(),
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An internal error occurred while updating the class.',
                'error' => app()->environment('local') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Archive a class (set isActive to false).
     */
    public function archive($classID)
    {
        try {
            $user = Auth::user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized',
                ], 401);
            }

            $class = ClassModel::where('classID', $classID)
                ->where('facultyID', $user->userID)
                ->first();

            if (!$class) {
                return response()->json([
                    'success' => false,
                    'message' => 'Class not found.',
                ], 404);
            }

            if (!$class->isActive) {
                return response()->json([
                    'success' => true,
                    'message' => 'Class is already archived.',
                    'class' => $class,
                ], 200);
            }

            $class->isActive = false;
            $class->save();

            return response()->json([
                'success' => true,
                'message' => 'Class archived successfully.',
                'class' => $class,
            ], 200);
        } catch (\Throwable $e) {
            Log::error('Error archiving class', [
                'user_id' => optional(Auth::user())->userID,
                'class_id' => $classID,
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An internal error occurred while archiving the class.',
                'error' => app()->environment('local') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Permanently delete a class.
     */
    public function destroy($classID)
    {
        try {
            $user = Auth::user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized',
                ], 401);
            }

            $class = ClassModel::where('classID', $classID)
                ->where('facultyID', $user->userID)
                ->first();

            if (!$class) {
                return response()->json([
                    'success' => false,
                    'message' => 'Class not found.',
                ], 404);
            }

            // Only allow deletion if class is archived
            if ($class->isActive) {
                return response()->json([
                    'success' => false,
                    'message' => 'Class must be archived before it can be deleted.',
                ], 400);
            }

            $class->delete();

            return response()->json([
                'success' => true,
                'message' => 'Class deleted successfully.',
            ], 200);
        } catch (\Throwable $e) {
            Log::error('Error deleting class', [
                'user_id' => optional(Auth::user())->userID,
                'class_id' => $classID,
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An internal error occurred while deleting the class.',
                'error' => app()->environment('local') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Generate a unique class code.
     */
    private function generateUniqueClassCode($length = 6)
    {
        do {
            $code = strtoupper(Str::random($length));
        } while (ClassModel::where('classCode', $code)->exists());

        return $code;
    }

    /**
     * Unarchive a class (set isActive to true).
     */
    public function unarchive($classID)
    {
        try {
            $user = Auth::user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized',
                ], 401);
            }

            $class = ClassModel::where('classID', $classID)
                ->where('facultyID', $user->userID)
                ->first();

            if (!$class) {
                return response()->json([
                    'success' => false,
                    'message' => 'Class not found.',
                ], 404);
            }

            if ($class->isActive) {
                return response()->json([
                    'success' => true,
                    'message' => 'Class is already active.',
                    'class' => $class,
                ], 200);
            }

            $class->isActive = true;
            $class->save();
            $class->load(['subject', 'faculty']);

            return response()->json([
                'success' => true,
                'message' => 'Class unarchived successfully.',
                'class' => $class,
            ], 200);
        } catch (\Throwable $e) {
            Log::error('Error unarchiving class', [
                'user_id' => optional(Auth::user())->userID,
                'class_id' => $classID,
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An internal error occurred while unarchiving the class.',
                'error' => app()->environment('local') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * List all archived classes created by the authenticated faculty.
     */
    public function archived()
    {
        try {
            $user = Auth::user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized',
                ], 401);
            }

            $classes = ClassModel::with(['subject', 'faculty', 'enrollments.student'])
                ->where('facultyID', $user->userID)
                ->where('isActive', false) // Only return archived classes
                ->orderByDesc('updated_at') // Order by when they were archived
                ->get();

            return response()->json([
                'success' => true,
                'message' => 'Archived classes retrieved successfully.',
                'classes' => $classes,
                'total' => $classes->count(),
            ], 200);
        } catch (\Throwable $e) {
            Log::error('Error listing archived classes', [
                'user_id' => optional(Auth::user())->userID,
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An error occurred while retrieving archived classes.',
                'error' => app()->environment('local') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Generate a unique invite token.
     */
    private function generateUniqueInviteToken($length = 32)
    {
        do {
            $token = Str::random($length);
        } while (ClassModel::where('inviteToken', $token)->exists());

        return $token;
    }
}

