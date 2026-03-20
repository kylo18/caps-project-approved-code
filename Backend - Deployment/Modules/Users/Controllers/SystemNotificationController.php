<?php

namespace Modules\Users\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Modules\Users\Models\User;
use App\Mail\SystemUpdateMail;
use Illuminate\Support\Facades\Mail;

class SystemNotificationController extends Controller
{
    public function sendSystemUpdate(Request $request)
    {
        $authUser = Auth::user();
        
        if (!in_array($authUser->roleID, [4, 5])) {
            return response()->json(['message' => 'Unauthorized. Only Dean or Associate Dean can send system notifications.'], 403);
        }

        $request->validate([
            'title' => 'required|string|max:255',
            'message' => 'required|string',
            'user_ids' => 'nullable|array',
            'user_ids.*' => 'integer|exists:users,userID',
            'send_all' => 'nullable|boolean',
            'role_filter' => 'nullable|integer|exists:roles,roleID',
            'campus_filter' => 'nullable|integer|exists:campuses,campusID',
            'program_filter' => 'nullable|integer|exists:programs,programID',
        ]);

        $query = User::query();

        if ($request->has('user_ids') && !empty($request->user_ids)) {
            $query->whereIn('userID', $request->user_ids);
        } elseif (!$request->boolean('send_all')) {
            if ($request->has('role_filter')) {
                $query->where('roleID', $request->role_filter);
            }
            if ($request->has('campus_filter')) {
                $query->where('campusID', $request->campus_filter);
            }
            if ($request->has('program_filter')) {
                $query->where('programID', $request->program_filter);
            }
        }

        $users = $query->where('isActive', true)->get();

        if ($users->isEmpty()) {
            return response()->json(['message' => 'No users found to notify.'], 404);
        }

        $sentCount = 0;
        $failedCount = 0;

        foreach ($users as $user) {
            try {
                Mail::to($user->email)->send(new SystemUpdateMail(
                    $request->title,
                    $request->message
                ));
                $sentCount++;
            } catch (\Exception $e) {
                Log::warning("Failed to send system update to user {$user->userID}: " . $e->getMessage());
                $failedCount++;
            }
        }

        return response()->json([
            'message' => 'System notification sent.',
            'sent' => $sentCount,
            'failed' => $failedCount,
            'total' => $users->count()
        ], 200);
    }
}