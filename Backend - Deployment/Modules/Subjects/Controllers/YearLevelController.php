<?php

namespace Modules\Subjects\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Modules\Subjects\Models\YearLevel;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class YearLevelController extends Controller
{
    /**
     * Display a listing of all year levels.
     * This endpoint is accessible by Dean, Program Chair, and Instructors.
     */
    public function index()
    {
        try {
            $user = Auth::user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized'
                ], 401);
            }

            // Only allow Dean (4), Associate Dean (5), Program Chair (3), and Instructors (2) to access
            if (!in_array($user->roleID, [2, 3, 4, 5])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Forbidden. Only Dean, Associate Dean, Program Chair, and Instructors can view year levels.'
                ], 403);
            }

            // Get all year levels with their associated subjects count
            $yearLevels = DB::table('year_levels')
                ->select('yearLevelID', 'name', 'created_at', 'updated_at')
                ->orderBy('yearLevelID', 'asc')
                ->get();

            if ($yearLevels->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'No year levels found',
                    'year_levels' => []
                ], 404);
            }

            return response()->json([
                'success' => true,
                'message' => 'Year levels retrieved successfully',
                'year_levels' => $yearLevels
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error retrieving year levels: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while retrieving year levels',
                'error' => $e->getMessage()
            ], 500);
        }
    }
} 