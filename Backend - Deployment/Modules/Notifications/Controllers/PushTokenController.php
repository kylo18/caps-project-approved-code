<?php

namespace Modules\Notifications\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class PushTokenController extends Controller
{
    public function store(Request $request)
    {
        $user = Auth::user();

        $validated = $request->validate([
            'token' => 'required|string|max:500',
            'platform' => 'required|in:android,ios',
        ]);

        $existingToken = DB::table('push_tokens')
            ->where('token', $validated['token'])
            ->first();

        if ($existingToken) {
            DB::table('push_tokens')
                ->where('token', $validated['token'])
                ->update([
                    'user_id' => $user->userID,
                    'platform' => $validated['platform'],
                    'last_used_at' => now(),
                    'updated_at' => now(),
                ]);
        } else {
            DB::table('push_tokens')->insert([
                'user_id' => $user->userID,
                'token' => $validated['token'],
                'platform' => $validated['platform'],
                'last_used_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        return response()->json([
            'message' => 'Push token registered successfully',
        ], 201);
    }

    public function destroy(Request $request)
    {
        $user = Auth::user();

        $validated = $request->validate([
            'token' => 'required|string|max:500',
        ]);

        DB::table('push_tokens')
            ->where('token', $validated['token'])
            ->where('user_id', $user->userID)
            ->delete();

        return response()->json([
            'message' => 'Push token removed successfully',
        ], 200);
    }
}
