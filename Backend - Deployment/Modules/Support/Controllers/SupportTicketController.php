<?php

namespace Modules\Support\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;
use Modules\Support\Models\SupportTicket;
use Illuminate\Support\Facades\Validator;
use Exception;

class SupportTicketController extends Controller
{
    /**
     * Store a newly created support ticket in storage.
     */
    public function store(Request $request)
    {
        try {
            // Require user to be authenticated
            $user = Auth::user();
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthenticated'
                ], 401);
            }

            // Validate the request
            $validator = Validator::make($request->all(), [
                'issue_type' => 'required|string|max:255',
                'subject' => 'required|string|max:255',
                'message' => 'required|string|min:10',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Create the ticket
            $ticket = SupportTicket::create([
                'user_id'     => $user->userID,
                'category'    => $this->mapIssueType($request->issue_type),
                'subject'     => $request->subject,
                'description' => $request->message,
                'status'      => 'open',
                'priority'    => 'medium',
            ]);

            // Send email notification — don't let a failure here break the response
            try {
                $emailService = app(\Modules\Users\Services\EmailNotificationService::class);
                $emailService->sendSupportTicketNotification($ticket, $user);
            } catch (Exception $e) {
                \Log::warning('Support ticket email failed: ' . $e->getMessage());
            }

            return response()->json([
                'success' => true,
                'message' => 'Support request submitted successfully.',
                'data' => $ticket
            ], 201);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to submit support request.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    private function mapIssueType(string $type): string
    {
        return match(true) {
            str_contains(strtolower($type), 'account') || str_contains(strtolower($type), 'login') => 'account',
            str_contains(strtolower($type), 'exam')    || str_contains(strtolower($type), 'quiz')  => 'academic',
            str_contains(strtolower($type), 'technical') || str_contains(strtolower($type), 'performance') || str_contains(strtolower($type), 'notification') => 'technical',
            default => 'other',
        };
    }

    /**
     * Display a listing of personal support tickets.
     */
    public function myTickets()
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return response()->json(['success' => false, 'message' => 'Unauthenticated'], 401);
            }

            $tickets = SupportTicket::where('user_id', $user->userID)
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $tickets
            ], 200);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve tickets.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display an admin listing of all support tickets.
     */
    public function index()
    {
        try {
            // Include basic user details
            $tickets = SupportTicket::with(['user' => function($query) {
                $query->select('userID', 'firstName', 'lastName', 'email', 'roleID');
            }])->orderBy('created_at', 'desc')->get();

            return response()->json([
                'success' => true,
                'data' => $tickets
            ], 200);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve tickets.',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
