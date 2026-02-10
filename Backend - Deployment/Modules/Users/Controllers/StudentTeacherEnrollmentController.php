<?php

namespace Modules\Users\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;
use Modules\Users\Models\StudentTeacherEnrollment;
use Modules\Users\Models\User;
use Illuminate\Support\Facades\Log;

class StudentTeacherEnrollmentController extends Controller
{
    /**
     * Enroll a student under a teacher.
     * Only students (roleID == 1) can enroll.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function enroll(Request $request)
    {
        try {
            $user = Auth::user();
            if ($user->roleID != 1) {
                return response()->json(['message' => 'Only students can enroll under a teacher.'], 403);
            }

            $validated = $request->validate([
                'teacher_id' => 'required|exists:users,id',
            ]);

            // Prevent duplicate enrollment
            $exists = StudentTeacherEnrollment::where('student_id', $user->id)
                ->where('teacher_id', $validated['teacher_id'])
                ->exists();
            if ($exists) {
                return response()->json(['message' => 'Already enrolled with this teacher.'], 409);
            }

            $enrollment = StudentTeacherEnrollment::create([
                'student_id' => $user->id,
                'teacher_id' => $validated['teacher_id'],
            ]);

            return response()->json([
                'message' => 'Enrolled successfully.',
                'data' => $enrollment
            ], 201);
        } catch (\Throwable $e) {
            Log::error('Student enrollment error: ' . $e->getMessage());
            return response()->json([
                'message' => 'An internal error occurred.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get all teachers a student is enrolled with.
     * Only students (roleID == 1) can fetch their teachers.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function myTeachers()
    {
        try {
            $user = Auth::user();
            if ($user->roleID != 1) {
                return response()->json(['message' => 'Only students can view their teachers.'], 403);
            }

            $teacherIds = StudentTeacherEnrollment::where('student_id', $user->id)->pluck('teacher_id');
            $teachers = User::whereIn('id', $teacherIds)->get();

            return response()->json([
                'message' => 'Teachers retrieved successfully.',
                'data' => $teachers
            ], 200);
        } catch (\Throwable $e) {
            Log::error('Fetching teachers error: ' . $e->getMessage());
            return response()->json([
                'message' => 'An internal error occurred.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get all students enrolled under the authenticated teacher.
     * Only accessible by teachers (roleID != 1).
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function myStudents()
    {
        try {
            $user = Auth::user();
            if ($user->roleID == 1) {
                return response()->json(['message' => 'Only teachers can view their students.'], 403);
            }

            $studentIds = StudentTeacherEnrollment::where('teacher_id', $user->id)->pluck('student_id');
            $students = User::whereIn('userID', $studentIds)->get();

            return response()->json([
                'message' => 'Students retrieved successfully.',
                'data' => $students
            ], 200);
        } catch (\Throwable $e) {
            Log::error('Fetching students error: ' . $e->getMessage());
            return response()->json([
                'message' => 'An internal error occurred.',
                'error' => $e->getMessage()
            ], 500);
        }
    }
} 