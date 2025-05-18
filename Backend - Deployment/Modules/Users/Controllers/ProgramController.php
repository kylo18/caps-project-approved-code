<?php

namespace Modules\Users\Controllers;

use Modules\Users\Models\Program;
use Illuminate\Routing\Controller;

class ProgramController extends Controller
{
    /**
     * Retrieve and return a list of all programs.
     *
     * Usage: Used when frontend or other systems need to display available programs
     * (e.g., dropdowns during registration or profile editing).
     */
    public function index()
    {
        try {
            // Fetch all programs with only the programID and programName columns
            $programs = Program::select('programID', 'programName')->get();

            // Return the list of programs in JSON format with a success message
            return response()->json([
                'message' => 'Programs fetched successfully.',
                'data' => $programs
            ], 200); // HTTP 200 OK
        } catch (\Exception $e) {
            // Catch and return any error that occurs during the fetch operation
            return response()->json([
                'message' => 'Failed to fetch programs.',
                'error' => $e->getMessage()
            ], 500); // HTTP 500 Internal Server Error
        }
    }
}
