<?php

namespace Modules\Users\Controllers;

use Modules\Users\Models\Program;
use Illuminate\Routing\Controller;

class ProgramController extends Controller
{
    public function index()
    {
        try {
            $programs = Program::select('programID', 'programName')->get();

            return response()->json([
                'message' => 'Programs fetched successfully.',
                'data' => $programs
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch programs.',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
