<?php

namespace Modules\Leaderboard\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;
use Modules\Users\Models\User;

class LeaderboardController extends Controller
{
    // Builds the leaderboard response, including filter options and weighted ranking data.
    public function index(Request $request)
    {
        $request->validate([
            'program' => 'nullable|integer|exists:programs,programID',
            'subject' => 'nullable|integer|exists:subjects,subjectID',
        ]);

        // Get programs for filter dropdown
        $programs = DB::table('programs')
            ->select('programID', 'programName')
            ->orderBy('programName')
            ->get();

        // Get subjects for filter dropdown
        $subjects = DB::table('subjects')
            ->select('subjectID', 'subjectName', 'subjectCode')
            ->orderBy('subjectName')
            ->get();

        $query = DB::table('practice_exam_results')
            ->select(
                'userID',
                DB::raw('MAX(percentage) as highest_percentage'),
                DB::raw('COUNT(*) as total_exams')
            )
            ->whereNotNull('userID')
            ->groupBy('userID')
            ->where('userID', '>', 0);

        if ($request->has('subject') && $request->subject) {
            $query->where('subjectID', $request->subject);
        }

        $results = $query->get();

        $userIds = $results->pluck('userID')->toArray();
        
        $users = User::whereIn('userID', $userIds)
            ->with(['program', 'role'])
            ->get()
            ->keyBy('userID');

        if ($request->has('program') && $request->program) {
            $users = $users->where('programID', $request->program);
        }

        $maxVolume = $results->max('total_exams') ?: 1;

        $leaderboard = $results->filter(function ($result) use ($users) {
            return $users->has($result->userID);
        })->map(function ($result) use ($users, $maxVolume) {
            $user = $users->get($result->userID);
            
            $normalizedVolume = ($result->total_exams / $maxVolume) * 100;
            $score = (0.7 * $result->highest_percentage) + (0.3 * $normalizedVolume);

            return [
                'userID' => $user->userID,
                'userCode' => $user->userCode,
                'firstName' => $user->firstName,
                'lastName' => $user->lastName,
                'name' => trim($user->firstName . ' ' . $user->lastName),
                'program' => $user->program ? $user->program->programName : null,
                'role' => $user->role ? $user->role->roleName : null,
                'highest_percentage' => round($result->highest_percentage, 2),
                'total_exams' => $result->total_exams,
                'points' => round($score * 10),
                'score' => round($score, 2),
            ];
        })->sortByDesc('score')->take(10)->values();

        $rank = 1;
        $leaderboard = $leaderboard->map(function ($entry) use (&$rank) {
            $entry['rank'] = $rank++;
            return $entry;
        });

        return response()->json([
            'leaderboard' => $leaderboard,
            'programs' => $programs,
            'subjects' => $subjects,
            'total' => $leaderboard->count()
        ], 200);
    }
}
