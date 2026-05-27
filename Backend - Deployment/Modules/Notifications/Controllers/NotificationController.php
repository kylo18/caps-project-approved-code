<?php

namespace Modules\Notifications\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Modules\Notifications\Services\PushNotificationService;

/**
 * Notification Controller
 * 
 * Handles in-app notifications for users including:
 * - Listing user notifications
 * - Marking notifications as read
 * - Bulk mark all as read
 * - Admin: creating system-wide notifications
 * 
 * Endpoints:
 * - GET /api/notifications - User's notifications (role 1)
 * - PATCH /api/notifications/{id}/read - Mark single as read
 * - POST /api/notifications/mark-all-read - Mark all as read
 * - POST /api/admin/notifications - Create notification (role 2-5)
 */
class NotificationController extends Controller
{
    public function __construct(private PushNotificationService $pushNotifications)
    {
    }

    /**
     * Get paginated list of notifications for authenticated user.
     * 
     * Authenticated: All roles can access their own notifications.
     * Returns notifications with metadata including unread count.
     * 
     * @param Request $request Optional pagination parameters
     * @return \Illuminate\Http\JsonResponse JSON response with notifications
     */
    public function index(Request $request)
    {
        try {
            $user = Auth::user();
            
            // Get notifications with pagination
            $notifications = DB::table('notifications')
                ->leftJoin('users as sender', 'notifications.sender_id', '=', 'sender.userID')
                ->where('notifications.user_id', $user->userID)
                ->orderBy('notifications.created_at', 'desc')
                ->select('notifications.*', 'sender.roleID as sender_role')
                ->paginate($request->input('per_page', 20));
            
            // Get unread count
            $unreadCount = DB::table('notifications')
                ->where('user_id', $user->userID)
                ->where('is_read', false)
                ->count();
            
            return response()->json([
                'message' => 'Notifications retrieved',
                'data' => $notifications->items(),
                'meta' => [
                    'unread_count' => $unreadCount,
                    'total_count' => $notifications->total(),
                    'current_page' => $notifications->currentPage(),
                    'last_page' => $notifications->lastPage()
                ]
            ], 200);
            
        } catch (\Exception $e) {
            Log::error('Notification retrieval error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error retrieving notifications',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Mark a single notification as read.
     * 
     * Authenticated: User can only mark their own notifications.
     * 
     * @param int $id Notification ID
     * @return \Illuminate\Http\JsonResponse JSON response confirming update
     */
    public function markAsRead($id)
    {
        try {
            $user = Auth::user();
            
            // Verify the notification belongs to this user
            $notification = DB::table('notifications')
                ->where('id', $id)
                ->where('user_id', $user->userID)
                ->first();
            
            if (!$notification) {
                return response()->json([
                    'message' => 'Notification not found'
                ], 404);
            }
            
            // Update the read status
            DB::table('notifications')
                ->where('id', $id)
                ->update([
                    'is_read' => true,
                    'updated_at' => now()
                ]);
            
            return response()->json([
                'message' => 'Notification marked as read',
                'notification_id' => $id
            ], 200);
            
        } catch (\Exception $e) {
            Log::error('Mark as read error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error updating notification',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Mark all notifications as read for the authenticated user.
     * 
     * Bulk operation to clear all unread notifications.
     * 
     * @return \Illuminate\Http\JsonResponse JSON response with count
     */
    public function markAllAsRead()
    {
        try {
            $user = Auth::user();
            
            // Update all unread notifications
            $updated = DB::table('notifications')
                ->where('user_id', $user->userID)
                ->where('is_read', false)
                ->update([
                    'is_read' => true,
                    'updated_at' => now()
                ]);
            
            return response()->json([
                'message' => 'All notifications marked as read',
                'updated_count' => $updated
            ], 200);
            
        } catch (\Exception $e) {
            Log::error('Mark all as read error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error updating notifications',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get unread notification count.
     * 
     * Lightweight endpoint for polling badge updates.
     * 
     * @return \Illuminate\Http\JsonResponse JSON response with count
     */
    public function getUnreadCount()
    {
        try {
            $user = Auth::user();
            
            $count = DB::table('notifications')
                ->where('user_id', $user->userID)
                ->where('is_read', false)
                ->count();
            
            return response()->json([
                'unread_count' => $count
            ], 200);
            
        } catch (\Exception $e) {
            Log::error('Unread count error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Admin: Get notifications created/sent by the authenticated staff user.
     *
     * Useful for viewing announcement history created by the sender.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function sent(Request $request)
    {
        try {
            $user = Auth::user();

            // Only staff roles can view their sent announcements
            if (!in_array($user->roleID, [2, 3, 4, 5])) {
                return response()->json(['message' => 'Unauthorized. Staff access only.'], 403);
            }

            $perPage = $request->input('per_page', 20);

            // Group sent notifications by title/message/type/target to present them
            // as a single announcement (one creation event may create many rows for recipients).
            // We use MIN(id) as a representative id and MAX(created_at) to order by latest batch.
            $grouped = DB::table('notifications')
                ->where('notifications.sender_id', $user->userID)
                ->selectRaw(
                    'MIN(notifications.id) as id, notifications.title, notifications.message, notifications.type, COUNT(*) as recipient_count, MAX(notifications.created_at) as created_at'
                )
                ->groupBy('notifications.title', 'notifications.message', 'notifications.type')
                ->orderByRaw('MAX(notifications.created_at) DESC');

            // Fetch all grouped results and perform simple application-level pagination
            $all = $grouped->get()->toArray();
            $page = max(1, (int) $request->input('page', 1));
            $total = count($all);
            $lastPage = (int) ceil($total / $perPage);
            $offset = ($page - 1) * $perPage;
            $paged = array_slice($all, $offset, $perPage);

            return response()->json([
                'message' => 'Sent notifications retrieved',
                'data' => $paged,
                'meta' => [
                    'total_count' => $total,
                    'current_page' => $page,
                    'last_page' => $lastPage
                ]
            ], 200);

        } catch (\Exception $e) {
            Log::error('Sent notifications error: ' . $e->getMessage());
            return response()->json(['message' => 'Error retrieving sent notifications', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Admin: Create a new notification for a user or group.
     * 
     * Protected: Requires a staff role (Faculty, Program Chair, Dean, or Associate Dean)
     * Can target specific users or broadcast to all users.
     * 
     * @param Request $request Contains type, title, message, target
     * @return \Illuminate\Http\JsonResponse JSON response with created notification
     */
    public function create(Request $request)
    {
        try {
            $user = Auth::user();
            
            // Faculty, Program Chair, Dean, and Associate Dean can create announcements.
            if (!in_array($user->roleID, [2, 3, 4, 5])) {
                return response()->json(['message' => 'Unauthorized. Staff access only.'], 403);
            }
            
            // Validate request
            $validated = $request->validate([
                'type' => 'required|in:achievement,lesson_available,quiz_result,system_announcement,milestone,enrollment',
                'title' => 'required|string|max:255',
                'message' => 'required|string',
                'target_type' => 'required|in:user,role,campus,program,all,enrolled,program_students,class_students',
                'target_id' => 'nullable|integer',
                'data' => 'nullable|array'
            ]);

            // Scope/Security validation for staff roles
            if ($user->roleID === 3) {
                // Program Chair: force targeting of only students in their own program
                $validated['target_type'] = 'program_students';
                $validated['target_id'] = $user->programID;
            } elseif ($user->roleID === 2) {
                // Faculty: restrict specific class announcement to classes they teach
                if ($validated['target_type'] === 'class_students') {
                    $ownsClass = DB::table('classes')
                        ->where('classID', $validated['target_id'])
                        ->where('facultyID', $user->userID)
                        ->exists();
                    if (!$ownsClass) {
                        return response()->json(['message' => 'Unauthorized. You do not teach this class.'], 403);
                    }
                } elseif (!in_array($validated['target_type'], ['enrolled', 'user'])) {
                    // Faculty can only announce to their enrolled students, a class they teach, or a specific user
                    return response()->json(['message' => 'Unauthorized. Faculty can only target enrolled students, classes they teach, or specific users.'], 403);
                }
            }
            
            $createdCount = 0;
            
            // Determine target users based on target_type
            $targetUsers = $this->getTargetUsers($validated['target_type'], $validated['target_id'] ?? null, $user);

            // Exclude the sender from recipients (sender should not receive their own announcement)
            $targetUsers = array_values(array_diff($targetUsers, [$user->userID]));

            // If no recipients remain after exclusion, return success with zero created.
            if (empty($targetUsers)) {
                return response()->json([
                    'message' => 'Notification created successfully (no recipients after excluding sender)',
                    'created_count' => 0,
                    'push' => []
                ], 201);
            }

            // Create notification for each target user
            foreach ($targetUsers as $targetUserId) {
                DB::table('notifications')->insert([
                    'user_id' => $targetUserId,
                    'sender_id' => $user->userID,
                    'type' => $validated['type'],
                    'name' => $this->buildNotificationName($validated['type']),
                    'title' => $validated['title'],
                    'message' => $validated['message'],
                    'data' => isset($validated['data']) ? json_encode($validated['data']) : null,
                    'is_read' => false,
                    'created_at' => now(),
                    'updated_at' => now()
                ]);
                $createdCount++;
            }

            $pushResult = $this->pushNotifications->sendToUsers(
                $targetUsers,
                $validated['title'],
                $validated['message'],
                array_merge($validated['data'] ?? [], [
                    'type' => $validated['type'],
                ])
            );
            
            return response()->json([
                'message' => 'Notification created successfully',
                'created_count' => $createdCount,
                'push' => $pushResult
            ], 201);
            
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Create notification error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error creating notification',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a notification.
     * 
     * User can delete their own notifications.
     * 
     * @param int $id Notification ID
     * @return \Illuminate\Http\JsonResponse JSON response confirming deletion
     */
    public function destroy($id)
    {
        try {
            $user = Auth::user();
            
            // Verify ownership
            $deleted = DB::table('notifications')
                ->where('id', $id)
                ->where('user_id', $user->userID)
                ->delete();
            
            if ($deleted === 0) {
                return response()->json([
                    'message' => 'Notification not found'
                ], 404);
            }
            
            return response()->json([
                'message' => 'Notification deleted'
            ], 200);
            
        } catch (\Exception $e) {
            Log::error('Delete notification error: ' . $e->getMessage());
            return response()->json(['message' => 'Error deleting notification', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Helper: Get target users based on target_type and target_id.
     * 
     * @param string $targetType Type of target (user, role, campus, program, all)
     * @param int|null $targetId ID of the specific target
     * @param object $adminUser The admin user creating the notification
     * @return array Array of user IDs
     */
    private function getTargetUsers($targetType, $targetId, $adminUser)
    {
        switch ($targetType) {
            case 'user':
                // Specific user
                return [$targetId];
                
            case 'role':
                // All users with specific role
                return DB::table('users')
                    ->where('roleID', $targetId)
                    ->where('isActive', true)
                    ->pluck('userID')
                    ->toArray();
                
            case 'campus':
                // All users in specific campus
                return DB::table('users')
                    ->where('campusID', $targetId)
                    ->where('isActive', true)
                    ->pluck('userID')
                    ->toArray();
                
            case 'program':
                // All users in specific program
                return DB::table('users')
                    ->where('programID', $targetId)
                    ->where('isActive', true)
                    ->pluck('userID')
                    ->toArray();

            case 'program_students':
                // All students in specific program
                return DB::table('users')
                    ->where('programID', $targetId)
                    ->where('roleID', 1)
                    ->where('isActive', true)
                    ->pluck('userID')
                    ->toArray();

            case 'enrolled':
                // All students enrolled under this teacher
                $studentIds = DB::table('student_teacher_enrollments')
                    ->where('teacher_id', $adminUser->userID)
                    ->pluck('student_id')
                    ->toArray();
                return DB::table('users')
                    ->whereIn('userID', $studentIds)
                    ->where('roleID', 1)
                    ->where('isActive', true)
                    ->pluck('userID')
                    ->toArray();

            case 'class_students':
                // All students enrolled in a specific class
                return DB::table('class_enrollments')
                    ->where('classID', $targetId)
                    ->pluck('studentID')
                    ->toArray();
                
            case 'all':
            default:
                // All active users
                return DB::table('users')
                    ->where('isActive', true)
                    ->pluck('userID')
                    ->toArray();
        }
    }

    private function buildNotificationName(string $type): string
    {
        return ucwords(str_replace('_', ' ', $type));
    }

    /**
     * Delete a sent announcement by the authenticated staff user.
     * 
     * Protected: Requires staff role (Faculty, Program Chair, Dean, or Associate Dean)
     * Only allows deletion of announcements sent by the authenticated user.
     * 
     * @param int $id Notification ID
     * @return \Illuminate\Http\JsonResponse
     */
    public function deleteSent($id)
    {
        try {
            $user = Auth::user();

            // Only staff roles can delete their sent announcements
            if (!in_array($user->roleID, [2, 3, 4, 5])) {
                return response()->json(['message' => 'Unauthorized. Staff access only.'], 403);
            }

            $notification = DB::table('notifications')
                ->where('id', $id)
                ->where('sender_id', $user->userID)
                ->first();

            if (!$notification) {
                return response()->json(['message' => 'Announcement not found or you do not have permission to delete it.'], 404);
            }

            // Delete all notifications that belong to the same announcement batch.
            // We consider notifications with the same sender, title and created_at as one batch.
            $deletedCount = DB::table('notifications')
                ->where('sender_id', $user->userID)
                ->where('title', $notification->title)
                ->where('created_at', $notification->created_at)
                ->delete();

            return response()->json([
                'message' => 'Announcement deleted successfully',
                'deleted_count' => $deletedCount
            ], 200);

        } catch (\Exception $e) {
            Log::error('Delete sent announcement error: ' . $e->getMessage());
            return response()->json(['message' => 'Error deleting announcement', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Delete all announcements sent by the authenticated staff user.
     * 
     * Protected: Requires staff role (Faculty, Program Chair, Dean, or Associate Dean)
     * Deletes all announcements ever sent by the authenticated user.
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function deleteAllSent()
    {
        try {
            $user = Auth::user();

            // Only staff roles can delete their sent announcements
            if (!in_array($user->roleID, [2, 3, 4, 5])) {
                return response()->json(['message' => 'Unauthorized. Staff access only.'], 403);
            }

            $deletedCount = DB::table('notifications')
                ->where('sender_id', $user->userID)
                ->delete();

            return response()->json([
                'message' => 'All announcements deleted successfully',
                'deleted_count' => $deletedCount
            ], 200);

        } catch (\Exception $e) {
            Log::error('Delete all sent announcements error: ' . $e->getMessage());
            return response()->json(['message' => 'Error deleting announcements', 'error' => $e->getMessage()], 500);
        }
    }
}

