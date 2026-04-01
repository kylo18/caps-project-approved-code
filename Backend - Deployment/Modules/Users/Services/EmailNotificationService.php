<?php

namespace Modules\Users\Services;

use Illuminate\Support\Facades\Mail;
use Modules\Users\Emails\UserStatusMail;
use Modules\Users\Emails\ExamCompletionMail;
use Modules\Users\Models\EmailLog;
use Exception;

class EmailNotificationService
{
    /**
     * Send user status notification and log the result.
     */
    public function sendStatusNotification($user, $status)
    {
        try {
            // Use queue() for background sending (Point 7 in Enhancement Plan)
            Mail::to($user->email)->queue(new UserStatusMail($user, $status));

            EmailLog::create([
                'user_id' => $user->userID,
                'email' => $user->email,
                'type' => $status,
                'status' => 'success',
                'sent_at' => now(),
            ]);

            return true;
        } catch (\Throwable $e) {
            EmailLog::create([
                'user_id' => $user->userID,
                'email' => $user->email,
                'type' => $status,
                'status' => 'failed',
                'error_message' => $e->getMessage(),
                'sent_at' => now(),
            ]);

            return false;
        }
    }

    /**
     * Send exam completion notification.
     */
    public function sendExamCompletionNotification($user, $score, $examName = 'Applied Power Electronics')
    {
        try {
            Mail::to($user->email)->queue(new ExamCompletionMail($user, $score, $examName));

            EmailLog::create([
                'user_id' => $user->userID,
                'email' => $user->email,
                'type' => 'exam_completion',
                'status' => 'success',
                'sent_at' => now(),
            ]);

            return true;
        } catch (\Throwable $e) {
            EmailLog::create([
                'user_id' => $user->userID,
                'email' => $user->email,
                'type' => 'exam_completion',
                'status' => 'failed',
                'error_message' => $e->getMessage(),
                'sent_at' => now(),
            ]);

            return false;
        }
    }

    /**
     * Send new support ticket notification to admin.
     */
    public function sendSupportTicketNotification($ticket, $user)
    {
        try {
            $adminEmail = config('mail.from.address', 'admin@caps.edu.ph'); // Fallback to config email
            
            Mail::to($adminEmail)->queue(new \Modules\Users\Emails\SupportTicketAdminMail($ticket, $user));

            EmailLog::create([
                'user_id' => $user->userID,
                'email' => $adminEmail,
                'type' => 'support_ticket_admin_alert',
                'status' => 'success',
                'sent_at' => now(),
            ]);

            return true;
        } catch (\Throwable $e) {
            EmailLog::create([
                'user_id' => $user->userID,
                'email' => config('mail.from.address', 'admin@caps.edu.ph'),
                'type' => 'support_ticket_admin_alert',
                'status' => 'failed',
                'error_message' => $e->getMessage(),
                'sent_at' => now(),
            ]);

            return false;
        }
    }
}

