<?php

namespace Modules\Support\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Support Controller
 * 
 * Handles user support functionality including:
 * - FAQs (public access)
 * - Support ticket creation (authenticated)
 * - Ticket management for admins
 * 
 * Endpoints:
 * - GET /api/support/faqs - Public FAQ list
 * - POST /api/support/tickets - Create support ticket
 * - GET /api/support/tickets - List user's tickets
 * - GET /api/admin/support/tickets - Admin ticket list
 * - PATCH /api/admin/support/tickets/{id} - Update ticket status
 */
class SupportController extends Controller
{
    public function store(Request $request)
    {
        return $this->createTicket($request);
    }

    public function myTickets(Request $request)
    {
        return $this->getMyTickets($request);
    }

    public function index(Request $request)
    {
        return $this->getAdminTickets($request);
    }

    /**
     * Get list of frequently asked questions.
     * 
     * Public endpoint - no authentication required.
     * Returns active FAQs sorted by display order.
     * 
     * @param Request $request Optional category filter
     * @return \Illuminate\Http\JsonResponse JSON response with FAQs
     */
    public function getFaqs(Request $request)
    {
        try {
            $categoryId = $request->input('category_id');
            $categoryLabelColumn = Schema::hasColumn('faq_categories', 'name') ? 'name' : 'subject';
            
            $query = DB::table('faqs')
                ->where('is_active', true)
                ->orderBy('display_order');
            
            if ($categoryId) {
                $query->where('category_id', $categoryId);
            }
            
            $faqs = $query->get();
            $categories = DB::table('faq_categories')
                ->orderBy('display_order')
                ->get();
            $categoriesById = $categories->keyBy('id');

            $normalizedFaqs = $faqs->map(function ($faq) use ($categoriesById, $categoryLabelColumn) {
                $category = $categoriesById->get($faq->category_id);
                $faq->category = $category ? ($category->{$categoryLabelColumn} ?? 'Uncategorized') : 'Uncategorized';
                return $faq;
            });
            
            // Group by category if no specific category selected
            if (!$categoryId) {
                $groupedFaqs = [];
                foreach ($categories as $category) {
                    $label = $category->{$categoryLabelColumn} ?? 'Uncategorized';
                    $groupedFaqs[$label] = $normalizedFaqs->where('category_id', $category->id)->values();
                }
                
                // Also include uncategorized FAQs
                $groupedFaqs['Uncategorized'] = $normalizedFaqs->whereNull('category_id')->values();
                
                return response()->json([
                    'success' => true,
                    'message' => 'FAQs retrieved successfully',
                    'data' => $groupedFaqs,
                    'categories' => $categories
                ], 200);
            }
            
            return response()->json([
                'success' => true,
                'message' => 'FAQs retrieved successfully',
                'data' => $normalizedFaqs->values()
            ], 200);
            
        } catch (\Exception $e) {
            Log::error('FAQ retrieval error: ' . $e->getMessage());
            return response()->json([
                'message' => 'An internal server error occurred',
                'type' => 'server_error'
            ], 500);
        }
    }

    /**
     * Create a new support ticket.
     * 
     * Authenticated endpoint - requires login.
     * Creates a new support request for the user.
     * 
     * @param Request $request Contains subject, description, category
     * @return \Illuminate\Http\JsonResponse JSON response with created ticket
     */
    public function createTicket(Request $request)
    {
        try {
            // Ensure user is authenticated
            $user = Auth::user();
            if (!$user) {
                return response()->json([
                    'message' => 'Unauthenticated'
                ], 401);
            }

            $payload = $this->normalizeTicketPayload($request);
            
            // Validate request data
            $validated = validator($payload, [
                'subject' => 'required|string|max:255',
                'description' => 'required|string|min:10',
                'category' => 'required|in:technical,account,academic,other',
            ])->validate();

            $request->validate([
                'attachment' => 'nullable|file|max:10240|mimes:jpg,jpeg,png,pdf,doc,docx'
            ]);
            
            // Handle file attachment if provided
            $attachmentPath = null;
            if ($request->hasFile('attachment')) {
                $attachmentPath = $request->file('attachment')->store('support_attachments', 'public');
            }
            
            // Insert ticket into database
            $ticketId = DB::table('support_tickets')->insertGetId([
                'user_id' => $user->userID,
                'subject' => $validated['subject'],
                'description' => $validated['description'],
                'category' => $validated['category'],
                'status' => 'open',
                'priority' => 'medium',
                'attachment_path' => $attachmentPath,
                'created_at' => now(),
                'updated_at' => now()
            ]);

            // Notify administrators
            try {
                $emailService = app(\Modules\Users\Services\EmailNotificationService::class);
                $ticket = DB::table('support_tickets')->find($ticketId);
                $emailService->sendSupportTicketNotification($ticket, $user);
            } catch (\Exception $e) {
                Log::warning('Support ticket admin notification failed: ' . $e->getMessage());
            }
            
            return response()->json([
                'success' => true,
                'message' => 'Support ticket created successfully',
                'data' => [
                    'ticket_id' => $ticketId,
                    'subject' => $validated['subject'],
                    'category' => $validated['category'],
                    'status' => 'open',
                    'created_at' => now()->toDateTimeString()
                ]
            ], 201);
            
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Ticket creation error: ' . $e->getMessage());
            return response()->json([
                'message' => 'An internal server error occurred',
                'type' => 'server_error'
            ], 500);
        }
    }

    /**
     * Get list of tickets for the authenticated user.
     * 
     * Authenticated endpoint - returns only the user's own tickets.
     * 
     * @return \Illuminate\Http\JsonResponse JSON response with user's tickets
     */
    public function getMyTickets(Request $request)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return response()->json([
                    'message' => 'Unauthenticated'
                ], 401);
            }
            
            $query = DB::table('support_tickets')
                ->where('user_id', $user->userID)
                ->orderBy('created_at', 'desc');
            
            // Optional status filter
            if ($request->has('status') && $request->status !== 'all') {
                $query->where('status', $request->status);
            }
            
            $tickets = $query->get();
            
            return response()->json([
                'success' => true,
                'message' => 'Support tickets retrieved',
                'data' => $tickets,
                'total' => $tickets->count()
            ], 200);
            
        } catch (\Exception $e) {
            Log::error('Ticket retrieval error: ' . $e->getMessage());
            return response()->json([
                'message' => 'An internal server error occurred',
                'type' => 'server_error'
            ], 500);
        }
    }

    /**
     * Get single ticket details.
     * 
     * Authenticated - user can only view their own ticket.
     * 
     * @param int $id Ticket ID
     * @return \Illuminate\Http\JsonResponse JSON response with ticket details
     */
    public function getTicket($id)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return response()->json([
                    'message' => 'Unauthenticated'
                ], 401);
            }
            
            $ticket = DB::table('support_tickets')
                ->where('id', $id)
                ->where('user_id', $user->userID)
                ->first();
            
            if (!$ticket) {
                return response()->json([
                    'message' => 'Ticket not found'
                ], 404);
            }
            
            return response()->json([
                'success' => true,
                'message' => 'Ticket retrieved',
                'data' => $ticket
            ], 200);
            
        } catch (\Exception $e) {
            Log::error('Ticket detail error: ' . $e->getMessage());
            return response()->json([
                'message' => 'An internal server error occurred',
                'type' => 'server_error'
            ], 500);
        }
    }

    /**
     * Admin: Get all support tickets.
     * 
     * Protected: Requires role 2-5 (Faculty, Chair, Dean, Associate Dean)
     * Supports filtering by status, priority, category.
     * 
     * @param Request $request Optional filters
     * @return \Illuminate\Http\JsonResponse JSON response with all tickets
     */
    public function getAdminTickets(Request $request)
    {
        try {
            $user = Auth::user();
            
            // Role check is handled by middleware, but double-check here
            if (!in_array($user->roleID, [2, 3, 4, 5])) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
            
            $query = DB::table('support_tickets')
                ->join('users', 'support_tickets.user_id', '=', 'users.userID')
                ->select(
                    'support_tickets.*',
                    'users.firstName',
                    'users.lastName',
                    'users.email',
                    'users.userCode'
                )
                ->orderBy('support_tickets.created_at', 'desc');
            
            // Apply role-based filtering
            if ($user->roleID === 2 || $user->roleID === 3) {
                // Faculty/Chair - only their campus/program
                $query->where('users.campusID', $user->campusID)
                      ->where('users.programID', $user->programID);
            } elseif ($user->roleID === 5) {
                // Associate Dean - only their campus
                $query->where('users.campusID', $user->campusID);
            }
            // Dean (4) sees all
            
            // Optional filters
            if ($request->has('status') && $request->status !== 'all') {
                $query->where('support_tickets.status', $request->status);
            }
            if ($request->has('priority') && $request->priority !== 'all') {
                $query->where('support_tickets.priority', $request->priority);
            }
            if ($request->has('category') && $request->category !== 'all') {
                $query->where('support_tickets.category', $request->category);
            }
            
            $tickets = $query->paginate($request->input('per_page', 20));
            
            $tickets->getCollection()->transform(function ($ticket) {
                $ticket->student = [
                    'firstName' => $ticket->firstName,
                    'lastName' => $ticket->lastName,
                    'email' => $ticket->email,
                    'userCode' => $ticket->userCode,
                ];
                unset($ticket->firstName, $ticket->lastName, $ticket->email, $ticket->userCode);
                return $ticket;
            });
            
            return response()->json([
                'success' => true,
                'message' => 'Admin tickets retrieved',
                'data' => $tickets->items(),
                'meta' => [
                    'current_page' => $tickets->currentPage(),
                    'last_page' => $tickets->lastPage(),
                    'per_page' => $tickets->perPage(),
                    'total' => $tickets->total(),
                ]
            ], 200);
            
        } catch (\Exception $e) {
            Log::error('Admin ticket retrieval error: ' . $e->getMessage());
            return response()->json([
                'message' => 'An internal server error occurred',
                'type' => 'server_error'
            ], 500);
        }
    }

    /**
     * Admin: Get a single support ticket with student details.
     */
    public function getAdminTicket($id)
    {
        try {
            $user = Auth::user();

            if (!in_array($user->roleID, [2, 3, 4, 5])) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $query = DB::table('support_tickets')
                ->join('users', 'support_tickets.user_id', '=', 'users.userID')
                ->select(
                    'support_tickets.*',
                    'users.firstName',
                    'users.lastName',
                    'users.email',
                    'users.userCode',
                    'users.programID',
                    'users.campusID'
                )
                ->where('support_tickets.id', $id);

            if ($user->roleID === 2 || $user->roleID === 3) {
                $query->where('users.campusID', $user->campusID)
                      ->where('users.programID', $user->programID);
            } elseif ($user->roleID === 5) {
                $query->where('users.campusID', $user->campusID);
            }

            $ticket = $query->first();

            if (!$ticket) {
                return response()->json(['message' => 'Ticket not found'], 404);
            }

            $ticket->student = [
                'firstName' => $ticket->firstName,
                'lastName' => $ticket->lastName,
                'email' => $ticket->email,
                'userCode' => $ticket->userCode,
            ];
            unset($ticket->firstName, $ticket->lastName, $ticket->email);

            return response()->json([
                'success' => true,
                'message' => 'Admin ticket retrieved',
                'data' => $ticket,
            ], 200);
        } catch (\Exception $e) {
            Log::error('Admin ticket detail error: ' . $e->getMessage());
            return response()->json([
                'message' => 'An internal server error occurred',
                'type' => 'server_error'
            ], 500);
        }
    }

    /**
     * Admin: Update ticket status.
     * 
     * Protected: Requires role 3-5 (Chair, Dean, Associate Dean)
     * 
     * @param Request $request Contains status, priority
     * @param int $id Ticket ID
     * @return \Illuminate\Http\JsonResponse JSON response with updated ticket
     */
    public function updateTicket(Request $request, $id)
    {
        try {
            $user = Auth::user();
            
            // Only Chair, Dean, Associate Dean can update tickets
            if (!in_array($user->roleID, [3, 4, 5])) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
            
            $validated = $request->validate([
                'status' => 'sometimes|required|in:open,in_progress,resolved,closed',
                'priority' => 'sometimes|required|in:low,medium,high'
            ]);
            
            $updateData = [];
            if (isset($validated['status'])) {
                $updateData['status'] = $validated['status'];
                if (in_array($validated['status'], ['resolved', 'closed'])) {
                    $updateData['resolved_by'] = $user->userID;
                    $updateData['resolved_at'] = now();
                } else {
                    $updateData['resolved_by'] = null;
                    $updateData['resolved_at'] = null;
                }
            }
            if (isset($validated['priority'])) {
                $updateData['priority'] = $validated['priority'];
            }
            
            if (empty($updateData)) {
                return response()->json(['message' => 'No changes provided'], 400);
            }
            
            $updateData['updated_at'] = now();
            
            DB::table('support_tickets')
                ->where('id', $id)
                ->update($updateData);
            
            $updatedTicket = DB::table('support_tickets')->find($id);
            
            return response()->json([
                'success' => true,
                'message' => 'Ticket updated successfully',
                'data' => $updatedTicket
            ], 200);
            
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Ticket update error: ' . $e->getMessage());
            return response()->json([
                'message' => 'An internal server error occurred',
                'type' => 'server_error'
            ], 500);
        }
    }

    private function normalizeTicketPayload(Request $request): array
    {
        $issueType = (string) $request->input('issue_type', '');

        return [
            'subject' => $request->input('subject'),
            'description' => $request->input('description', $request->input('message')),
            'category' => $request->input('category', $this->mapIssueType($issueType)),
        ];
    }

    private function mapIssueType(string $type): string
    {
        $type = strtolower($type);

        return match (true) {
            str_contains($type, 'account'), str_contains($type, 'login') => 'account',
            str_contains($type, 'exam'), str_contains($type, 'quiz') => 'academic',
            str_contains($type, 'technical'), str_contains($type, 'performance'), str_contains($type, 'notification') => 'technical',
            default => 'other',
        };
    }

    /**
     * Get FAQ categories.
     * 
     * Public endpoint for getting category list.
     * 
     * @return \Illuminate\Http\JsonResponse JSON response with categories
     */
    public function getCategories()
    {
        try {
            $categories = DB::table('faq_categories')
                ->orderBy('display_order')
                ->get();
            
            return response()->json([
                'success' => true,
                'message' => 'Categories retrieved',
                'data' => $categories
            ], 200);
            
        } catch (\Exception $e) {
            Log::error('Category retrieval error: ' . $e->getMessage());
            return response()->json([
                'message' => 'An internal server error occurred',
                'type' => 'server_error'
            ], 500);
        }
    }
}
