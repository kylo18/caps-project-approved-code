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
use Modules\PersonalExams\Models\StudentQuizResult;

class ClassEnrollmentController extends Controller
{
    /**
     * Join a class by code.
     */
    public function joinByCode(Request $request)
    {
        try {
            $user = Auth::user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized',
                ], 401);
            }

            // Check if user is a student (roleID 1)
            if ($user->roleID != 1) {
                return response()->json([
                    'success' => false,
                    'message' => 'Only students can join classes.',
                ], 403);
            }

            try {
                $validated = $request->validate([
                    'classCode' => 'required|string|size:6',
                ]);
            } catch (ValidationException $e) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $e->errors(),
                ], 422);
            }

            $class = ClassModel::where('classCode', $validated['classCode'])
                ->where('isActive', true)
                ->first();

            if (!$class) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid class code or class is not active.',
                ], 404);
            }

            // Check if already enrolled
            $existingEnrollment = ClassEnrollment::where('classID', $class->classID)
                ->where('studentID', $user->userID)
                ->first();

            if ($existingEnrollment) {
                return response()->json([
                    'success' => false,
                    'message' => 'You are already enrolled in this class.',
                ], 422);
            }

            // Create enrollment
            $enrollment = ClassEnrollment::create([
                'classID' => $class->classID,
                'studentID' => $user->userID,
                'enrolledAt' => now(),
            ]);

            $class->load(['faculty']);

            return response()->json([
                'success' => true,
                'message' => 'Successfully joined the class.',
                'class' => $class,
                'enrollment' => $enrollment,
            ], 201);
        } catch (\Throwable $e) {
            Log::error('Error joining class by code', [
                'user_id' => optional(Auth::user())->userID,
                'payload' => $request->all(),
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An internal error occurred while joining the class.',
            ], 500);
        }
    }

    /**
     * Join a class by invite link.
     * The link contains a token that we'll extract from the URL.
     */
    public function joinByLink($token)
    {
        try {
            $user = Auth::user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized. Please log in to join the class.',
                ], 401);
            }

            // Check if user is a student (roleID 1)
            if ($user->roleID != 1) {
                return response()->json([
                    'success' => false,
                    'message' => 'Only students can join classes.',
                ], 403);
            }

            // Find class by invite token
            $class = ClassModel::where('inviteToken', $token)
                ->where('isActive', true)
                ->first();

            if (!$class) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid invite link or class is not active.',
                ], 404);
            }

            // Check if already enrolled
            $existingEnrollment = ClassEnrollment::where('classID', $class->classID)
                ->where('studentID', $user->userID)
                ->first();

            if ($existingEnrollment) {
                return response()->json([
                    'success' => true,
                    'message' => 'You are already enrolled in this class.',
                    'class' => $class->load(['faculty']),
                    'enrollment' => $existingEnrollment,
                ], 200);
            }

            // Create enrollment
            $enrollment = ClassEnrollment::create([
                'classID' => $class->classID,
                'studentID' => $user->userID,
                'enrolledAt' => now(),
            ]);

            $class->load(['faculty']);

            return response()->json([
                'success' => true,
                'message' => 'Successfully joined the class.',
                'class' => $class,
                'enrollment' => $enrollment,
            ], 201);
        } catch (\Throwable $e) {
            Log::error('Error joining class by link', [
                'user_id' => optional(Auth::user())->userID,
                'token' => $token,
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An internal error occurred while joining the class.',
            ], 500);
        }
    }

    /**
     * Get all students enrolled in a class (faculty only).
     */
    public function index($classID)
    {
        try {
            $user = Auth::user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized',
                ], 401);
            }

            // Verify the class belongs to the faculty
            $class = ClassModel::where('classID', $classID)
                ->where('facultyID', $user->userID)
                ->first();

            if (!$class) {
                return response()->json([
                    'success' => false,
                    'message' => 'Class not found or you do not have permission.',
                ], 404);
            }

            // Get total number of quizzes assigned to this class
            $totalQuizzes = ClassPersonalQuiz::where('classID', $classID)->count();

            // Get all classPersonalQuizIDs for this class (for efficient querying)
            $classPersonalQuizIds = ClassPersonalQuiz::where('classID', $classID)
                ->pluck('classPersonalQuizID')
                ->toArray();

            // Get all enrollments with student details
            $enrollments = ClassEnrollment::where('classID', $classID)
                ->with(['student.program'])
                ->orderBy('enrolledAt', 'desc')
                ->get();

            // Format the response
            $students = $enrollments->map(function ($enrollment) use ($classPersonalQuizIds, $totalQuizzes) {
                $student = $enrollment->student;
                
                // Count unique quizzes the student has completed in this class
                // Using StudentQuizResult to get distinct quizzes (each quiz counts as 1 regardless of attempts)
                $completedQuizzes = StudentQuizResult::whereIn('class_quiz_assignment_id', $classPersonalQuizIds)
                    ->where('studentID', $student->userID)
                    ->where('isRecorded', true)
                    ->pluck('class_quiz_assignment_id')
                    ->unique()
                    ->count();
                
                return [
                    'enrollmentID' => $enrollment->enrollmentID,
                    'studentID' => $student->userID,
                    'userCode' => $student->userCode,
                    'firstName' => $student->firstName,
                    'lastName' => $student->lastName,
                    'email' => $student->email,
                    'program' => $student->program ? $student->program->programName : 'N/A',
                    'programID' => $student->programID,
                    'enrolledAt' => $enrollment->enrolledAt,
                    'created_at' => $enrollment->created_at,
                    'updated_at' => $enrollment->updated_at,
                    'quizzesCompleted' => $completedQuizzes,
                    'totalQuizzes' => $totalQuizzes,
                    'quizProgress' => $totalQuizzes > 0 
                        ? $completedQuizzes . '/' . $totalQuizzes 
                        : '0/0',
                ];
            });

            return response()->json([
                'success' => true,
                'message' => 'Enrolled students retrieved successfully.',
                'class' => [
                    'classID' => $class->classID,
                    'className' => $class->className,
                    'classCode' => $class->classCode,
                ],
                'students' => $students,
                'total' => $students->count(),
            ], 200);
        } catch (\Throwable $e) {
            Log::error('Error retrieving enrolled students', [
                'user_id' => optional(Auth::user())->userID,
                'class_id' => $classID,
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An internal error occurred while retrieving enrolled students.',
            ], 500);
        }
    }

    /**
     * Get all classes that the authenticated student is enrolled in.
     */
    public function myClasses()
    {
        try {
            $user = Auth::user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized',
                ], 401);
            }

            // Check if user is a student (roleID 1)
            if ($user->roleID != 1) {
                return response()->json([
                    'success' => false,
                    'message' => 'Only students can view their enrolled classes.',
                ], 403);
            }

            // Get all enrollments for this student with class details
            $enrollments = ClassEnrollment::where('studentID', $user->userID)
                ->with([
                    'class.faculty',
                    'class.faculty.program'
                ])
                ->orderBy('enrolledAt', 'desc')
                ->get();

            // Format the response
            $classes = $enrollments->map(function ($enrollment) {
                $class = $enrollment->class;
                
                if (!$class) {
                    return null;
                }

                return [
                    'enrollmentID' => $enrollment->enrollmentID,
                    'classID' => $class->classID,
                    'className' => $class->className,
                    'classCode' => $class->classCode,
                    'description' => $class->description,
                    'schedule' => $class->schedule,
                    'isActive' => $class->isActive,
                    'faculty' => $class->faculty ? [
                        'userID' => $class->faculty->userID,
                        'userCode' => $class->faculty->userCode,
                        'firstName' => $class->faculty->firstName,
                        'lastName' => $class->faculty->lastName,
                        'email' => $class->faculty->email,
                    ] : null,
                    'enrolledAt' => $enrollment->enrolledAt,
                    'created_at' => $class->created_at,
                    'updated_at' => $class->updated_at,
                ];
            })->filter(); // Remove null entries

            return response()->json([
                'success' => true,
                'message' => 'Enrolled classes retrieved successfully.',
                'classes' => $classes,
                'total' => $classes->count(),
            ], 200);
        } catch (\Throwable $e) {
            Log::error('Error retrieving student enrolled classes', [
                'user_id' => optional(Auth::user())->userID,
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An internal error occurred while retrieving enrolled classes.',
            ], 500);
        }
    }

    /**
     * Unenroll from a class (student only).
     */
    public function unenroll($classID)
    {
        try {
            $user = Auth::user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized',
                ], 401);
            }

            // Check if user is a student (roleID 1)
            if ($user->roleID != 1) {
                return response()->json([
                    'success' => false,
                    'message' => 'Only students can unenroll from classes.',
                ], 403);
            }

            // Find the enrollment
            $enrollment = ClassEnrollment::where('classID', $classID)
                ->where('studentID', $user->userID)
                ->first();

            if (!$enrollment) {
                return response()->json([
                    'success' => false,
                    'message' => 'You are not enrolled in this class.',
                ], 404);
            }

            // Get class info before deletion for response
            $class = ClassModel::where('classID', $classID)
                ->first();

            // Delete the enrollment
            $enrollment->delete();

            return response()->json([
                'success' => true,
                'message' => 'Successfully unenrolled from the class.',
                'class' => $class ? [
                    'classID' => $class->classID,
                    'className' => $class->className,
                    'classCode' => $class->classCode,
                ] : null,
            ], 200);
        } catch (\Throwable $e) {
            Log::error('Error unenrolling student from class', [
                'user_id' => optional(Auth::user())->userID,
                'class_id' => $classID,
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An internal error occurred while unenrolling from the class.',
            ], 500);
        }
    }

    /**
     * Remove a student from a class (faculty only).
     */
    public function removeStudent(Request $request, $classID)
    {
        try {
            $user = Auth::user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized',
                ], 401);
            }

            // Verify the class belongs to the faculty
            $class = ClassModel::where('classID', $classID)
                ->where('facultyID', $user->userID)
                ->first();

            if (!$class) {
                return response()->json([
                    'success' => false,
                    'message' => 'Class not found or you do not have permission.',
                ], 404);
            }

            try {
                $validated = $request->validate([
                    'studentID' => 'required|exists:users,userID',
                ]);
            } catch (ValidationException $e) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $e->errors(),
                ], 422);
            }

            $enrollment = ClassEnrollment::where('classID', $classID)
                ->where('studentID', $validated['studentID'])
                ->first();

            if (!$enrollment) {
                return response()->json([
                    'success' => false,
                    'message' => 'Student is not enrolled in this class.',
                ], 404);
            }

            $enrollment->delete();

            return response()->json([
                'success' => true,
                'message' => 'Student removed from class successfully.',
            ], 200);
        } catch (\Throwable $e) {
            Log::error('Error removing student from class', [
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
                'message' => 'An internal error occurred while removing the student.',
            ], 500);
        }
    }
}

