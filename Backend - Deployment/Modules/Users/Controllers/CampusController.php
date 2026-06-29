<?php

namespace Modules\Users\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Modules\Users\Models\Campus;

class CampusController extends Controller
{
    /**
     * Retrieve and return a list of all campuses.
     */
    public function index()
    {
        try {
            $campuses = Campus::select('campusID', 'campusName')
                ->orderBy('campusName')
                ->get();

            if ($campuses->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'No campuses found.',
                    'data' => [],
                ], 404);
            }

            return response()->json([
                'success' => true,
                'message' => 'Campuses retrieved successfully.',
                'data' => $campuses,
            ], 200);
        } catch (\Throwable $e) {
            Log::error('Error fetching campuses', [
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An error occurred while retrieving campuses. Please try again later.',
                'error' => app()->environment('local') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Store a new campus. Only accessible by the Dean (roleID: 4).
     */
    public function store(Request $request)
    {
        try {
            $user = Auth::user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'You are not authenticated. Please log in to create a campus.',
                ], 401);
            }

            if ($user->roleID !== 4) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized. Only the Dean can create campuses.',
                ], 403);
            }

            $validated = $request->validate([
                'campusName' => 'required|string|max:100|unique:campuses,campusName',
            ]);

            $campusName = trim($validated['campusName']);

            $existingCampus = Campus::where('campusName', $campusName)->first();
            if ($existingCampus) {
                return response()->json([
                    'success' => false,
                    'message' => 'A campus with this name already exists.',
                    'data' => $existingCampus,
                ], 409);
            }

            $campus = Campus::create([
                'campusName' => $campusName,
            ]);

            Log::info('Campus created successfully', [
                'campusID' => $campus->campusID,
                'campusName' => $campus->campusName,
                'createdBy' => $user->userID,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Campus created successfully.',
                'data' => [
                    'campusID' => $campus->campusID,
                    'campusName' => $campus->campusName,
                ],
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed. Please check the campus name and try again.',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Throwable $e) {
            Log::error('Error creating campus', [
                'user_id' => optional(Auth::user())->userID,
                'campus_name' => $request->input('campusName'),
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An error occurred while creating the campus. Please try again later.',
                'error' => app()->environment('local') ? $e->getMessage() : null,
            ], 500);
        }
    }
}
