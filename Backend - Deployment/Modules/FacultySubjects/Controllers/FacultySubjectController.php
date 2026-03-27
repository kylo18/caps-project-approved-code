<?php

namespace Modules\FacultySubjects\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Routing\Controller;
use Modules\Subjects\Models\Subject;
use Illuminate\Support\Facades\Log;

class FacultySubjectController extends Controller
{
    /**
     * Check if the authenticated user has one of the allowed roles.
     * Allowed roles: Instructor (2), Program Chair (3), Dean (4), Associate Dean (5).
     *
     * @param array $roles
     * @return \Illuminate\Http\JsonResponse|\Illuminate\Contracts\Auth\Authenticatable|null
     */
    private function checkUserRole($roles = [2, 3, 4, 5])
    {
        $user = Auth::user();

        if (!in_array($user->roleID, $roles)) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        return $user;
    }

    /**
     * Retrieve subjects based on the user's program, including general subjects (programID 6).
     *
     * @return \Illuminate\Support\Collection
     */
    private function getSubjectsByUserProgram()
    {
        $user = Auth::user();
        $userProgramID = $user->programID;

        $subjects = DB::table('subjects as s')
            ->join('programs as p', 'p.programID', '=', 's.programID')
            ->join('year_levels as yl', 'yl.yearLevelID', '=', 's.yearLevelID')
            ->select(
                's.subjectID',
                's.subjectCode',
                's.subjectName',
                's.programID',
                'p.programName',
                's.yearLevelID',
                'yl.name as yearLevel'
            )
            ->where(function ($query) use ($userProgramID) {
                $query->where('s.programID', $userProgramID)
                      ->orWhere('s.programID', 6); // Include general subjects
            })
            ->orderBy('s.subjectID')
            ->get()
            ->map(function ($subject) {
                $programName = $subject->programName;
                if (strpos($programName, 'BS-') === 0) {
                    $programName = substr($programName, 3);
                }

                return [
                    'subjectID' => $subject->subjectID,
                    'subjectCode' => $subject->subjectCode,
                    'subjectName' => $subject->subjectName,
                    'programID' => $subject->programID,
                    'programName' => $programName,
                    'yearLevelID' => $subject->yearLevelID,
                    'yearLevel' => $subject->yearLevel
                ];
            });

        return $subjects;
    }

    /**
     * Assign a subject to the authenticated faculty.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function assignSubject(Request $request)
    {
        try {
            $user = $this->checkUserRole();

            $request->validate([
                'subjectID' => 'required|exists:subjects,subjectID',
            ]);

            $subjectID = $request->subjectID;

            // Get the subject details first
            $subject = Subject::find($subjectID);
            if (!$subject) {
                Log::warning('Attempt to assign non-existent subject', [
                    'subjectID' => $subjectID,
                    'userID' => $user->userID
                ]);
                return response()->json([
                    'success' => false,
                    'message' => 'Subject not found.'
                ], 404);
            }

            // Prevent duplicate assignments
            if ($user->subjects()->where('faculty_subjects.subjectID', $subjectID)->exists()) {
                Log::info('Attempt to assign already assigned subject', [
                    'subjectID' => $subjectID,
                    'userID' => $user->userID
                ]);
                return response()->json([
                    'success' => false,
                    'message' => 'Subject is already assigned to the user.'
                ], 409);
            }

            DB::beginTransaction();
            try {
                // Assign subject
                $user->subjects()->attach($subjectID);

                // Get the complete subject details with program and year level info
                $assignedSubject = DB::table('subjects as s')
                    ->join('programs as p', 'p.programID', '=', 's.programID')
                    ->join('year_levels as yl', 'yl.yearLevelID', '=', 's.yearLevelID')
                    ->where('s.subjectID', $subjectID)
                    ->select(
                        's.subjectID',
                        's.subjectCode',
                        's.subjectName',
                        's.programID',
                        'p.programName',
                        's.yearLevelID',
                        'yl.name as yearLevel'
                    )
                    ->first();

                $programName = $assignedSubject->programName;
                if (strpos($programName, 'BS-') === 0) {
                    $programName = substr($programName, 3);
                }

                DB::commit();

                Log::info('Subject successfully assigned to faculty', [
                    'subjectID' => $subjectID,
                    'userID' => $user->userID
                ]);

                return response()->json([
                    'success' => true,
                    'message' => 'Subject assigned successfully.',
                    'subject' => [
                        'subjectID' => $assignedSubject->subjectID,
                        'subjectCode' => $assignedSubject->subjectCode,
                        'subjectName' => $assignedSubject->subjectName,
                        'programID' => $assignedSubject->programID,
                        'programName' => $programName,
                        'yearLevelID' => $assignedSubject->yearLevelID,
                        'yearLevel' => $assignedSubject->yearLevel,
                        'isAssigned' => true
                    ]
                ], 200);

            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }

        } catch (\Exception $e) {
            Log::error('Failed to assign subject', [
                'error' => $e->getMessage(),
                'subjectID' => $subjectID ?? null,
                'userID' => $user->userID ?? null
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to assign subject.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get all subjects currently assigned to the authenticated faculty.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function mySubjects()
    {
        try {
            $user = $this->checkUserRole();

            $subjects = DB::table('subjects as s')
                ->join('faculty_subjects as fs', 's.subjectID', '=', 'fs.subjectID')
                ->join('programs as p', 's.programID', '=', 'p.programID')
                ->join('year_levels as yl', 'yl.yearLevelID', '=', 's.yearLevelID')
                ->where('fs.facultyID', $user->userID)
                ->select(
                    's.subjectID',
                    's.subjectCode',
                    's.subjectName',
                    's.programID',
                    'p.programName',
                    's.yearLevelID',
                    'yl.name as yearLevel'
                )
                ->orderBy('s.subjectID')
                ->get();

            if ($subjects->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'No subjects assigned',
                    'subjects' => []
                ], 404);
            }

            $formattedSubjects = $subjects->map(function ($subject) {
                $programName = $subject->programName;
                if (strpos($programName, 'BS-') === 0) {
                    $programName = substr($programName, 3);
                }

                return [
                    'subjectID' => $subject->subjectID,
                    'subjectCode' => $subject->subjectCode,
                    'subjectName' => $subject->subjectName,
                    'programID' => $subject->programID,
                    'programName' => $programName,
                    'yearLevelID' => $subject->yearLevelID,
                    'yearLevel' => $subject->yearLevel
                ];
            });

            return response()->json([
                'success' => true,
                'message' => 'Subjects retrieved successfully',
                'subjects' => $formattedSubjects
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error retrieving faculty subjects: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while retrieving subjects',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove an assigned subject from the authenticated faculty.
     *
     * @param int $subjectID The ID of the subject to be removed
     * @return \Illuminate\Http\JsonResponse
     */
    public function removeAssignedSubject(int $subjectID)
    {
        try {
            $user = $this->checkUserRole();

            // Check if the subject exists first
            $subject = Subject::find($subjectID);
            if (!$subject) {
                Log::warning('Attempt to remove non-existent subject', [
                    'subjectID' => $subjectID,
                    'userID' => $user->userID
                ]);
                return response()->json([
                    'success' => false,
                    'message' => 'Subject not found.'
                ], 404);
            }

            // Check if the subject is actually assigned
            if (!$user->subjects()->where('faculty_subjects.subjectID', $subjectID)->exists()) {
                Log::info('Attempt to remove unassigned subject', [
                    'subjectID' => $subjectID,
                    'userID' => $user->userID
                ]);
                return response()->json([
                    'success' => false,
                    'message' => 'Subject is not assigned to this user.'
                ], 404);
            }

            DB::beginTransaction();
            try {
                $user->subjects()->detach($subjectID);
                DB::commit();

                Log::info('Subject successfully removed from faculty', [
                    'subjectID' => $subjectID,
                    'userID' => $user->userID
                ]);

                return response()->json([
                    'success' => true,
                    'message' => 'Assigned subject removed successfully.',
                    'data' => [
                        'subjectID' => $subjectID,
                        'subjectCode' => $subject->subjectCode
                    ]
                ], 200);

            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }

        } catch (\Exception $e) {
            Log::error('Failed to remove assigned subject', [
                'error' => $e->getMessage(),
                'subjectID' => $subjectID,
                'userID' => $user->userID ?? null
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to remove assigned subject.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Retrieve all subjects available to the authenticated user
     * (those under the user's program and general education subjects).
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function availableSubjects(Request $request)
    {
        try {
            $user = $this->checkUserRole();
            $userProgramID = $user->programID;

            $subjects = DB::table('subjects as s')
                ->join('programs as p', 'p.programID', '=', 's.programID')
                ->join('year_levels as yl', 'yl.yearLevelID', '=', 's.yearLevelID')
                ->leftJoin('faculty_subjects as fs', function($join) use ($user) {
                    $join->on('s.subjectID', '=', 'fs.subjectID')
                         ->where('fs.facultyID', '=', $user->userID);
                })
                ->select(
                    's.subjectID',
                    's.subjectCode',
                    's.subjectName',
                    's.programID',
                    'p.programName',
                    's.yearLevelID',
                    'yl.name as yearLevel',
                    DB::raw('CASE WHEN fs.subjectID IS NOT NULL THEN true ELSE false END as isAssigned')
                )
                ->where(function ($query) use ($userProgramID) {
                    $query->where('s.programID', $userProgramID)
                          ->orWhere('s.programID', 6); // Include general subjects
                })
                ->orderBy('s.subjectID')
                ->get();

            if ($subjects->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'No subjects available for your program',
                    'subjects' => []
                ], 404);
            }

            $formattedSubjects = $subjects->map(function ($subject) {
                $programName = $subject->programName;
                if (strpos($programName, 'BS-') === 0) {
                    $programName = substr($programName, 3);
                }

                return [
                    'subjectID' => $subject->subjectID,
                    'subjectCode' => $subject->subjectCode,
                    'subjectName' => $subject->subjectName,
                    'programID' => $subject->programID,
                    'programName' => $programName,
                    'yearLevelID' => $subject->yearLevelID,
                    'yearLevel' => $subject->yearLevel,
                    'isAssigned' => $subject->isAssigned
                ];
            });

            return response()->json([
                'success' => true,
                'message' => 'Available subjects retrieved successfully',
                'subjects' => $formattedSubjects
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error retrieving available subjects: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while retrieving available subjects',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
