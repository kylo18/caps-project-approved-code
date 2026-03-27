<?php
namespace Modules\Leaderboard\Controllers;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Modules\Users\Models\User;
use Modules\Leaderboard\Models\Leaderboard;

class LeaderboardController extends Controller
{
    // Builds the leaderboard response, including filter options and weighted ranking data.
    public function index(Request $request)
    {
        try {
            // Validate incoming request parameters
            $request->validate([
                'program' => 'nullable|integer|exists:programs,programID',
                'subject' => 'nullable|integer|exists:subjects,subjectID',
            ]);
            // Retrieve all programs for filter dropdown
            $programs = DB::table('programs')
                ->select('programID', 'programName')
                ->orderBy('programName')
                ->get();
            // Retrieve all subjects for filter dropdown
            $subjects = DB::table('subjects')
                ->select('subjectID', 'subjectName', 'subjectCode')
                ->orderBy('subjectName')
                ->get();
            // Extract optional filter parameters
            $subjectID = $request->has('subject') && $request->subject ? $request->subject : null;
            $programID = $request->has('program') && $request->program ? $request->program : null;
            // Retrieve top leaderboard records using the optimized Leaderboard model
            // This queries the dedicated leaderboards table instead of aggregating from practice_exam_results
            $records = Leaderboard::getTopRecords(10, $subjectID, $programID);
            // Transform records into API response format
            $leaderboard = $records->map(function ($record) {
                $user = $record->user;
                return [
                    'userID' => $user->userID,
                    'userCode' => $user->userCode,
                    'firstName' => $user->firstName,
                    'lastName' => $user->lastName,
                    'name' => trim($user->firstName . ' ' . $user->lastName),
                    'program' => $user->program ? $user->program->programName : null,
                    'role' => $user->role ? $user->role->roleName : null,
                    'highest_percentage' => round($record->highest_percentage, 2),
                    'total_exams' => $record->total_exams,
                    'points' => round($record->score * 10),
                    'score' => round($record->score, 2),
                ];
            });
            // Assign ranks to each entry (1st, 2nd, 3rd, etc.)
            $rank = 1;
            $leaderboard = $leaderboard->map(function ($entry) use (&$rank) {
                $entry['rank'] = $rank++;
                return $entry;
            });
            // Return successful response with leaderboard data and filter options
            return response()->json([
                'leaderboard' => $leaderboard,
                'programs' => $programs,
                'subjects' => $subjects,
                'total' => $leaderboard->count()
            ], 200);
        } catch (\Illuminate\Validation\ValidationException $e) {
            // Handle validation errors (invalid query parameters)
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            // Handle unexpected errors with logging
            Log::error('Leaderboard error: ' . $e->getMessage());
            return response()->json([
                'message' => 'An error occurred while retrieving the leaderboard.',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}