<?php

namespace Modules\Users\Services;

use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Modules\Users\Emails\UserStatusMail;
use Modules\Users\Emails\ExamCompletionMail;
use Modules\Users\Models\EmailLog;

class EmailNotificationService
{
    /**
     * Send user status notification and log the result.
     */
    public function sendStatusNotification($user, $status, $approvedBy = 'System Administrator')
    {
        // Skip send when recipient is missing.
        if (empty($user->email)) {
            return false;
        }

        $lastError = null;

        // Retry once to handle transient SMTP hiccups in Docker/network.
        for ($attempt = 1; $attempt <= 2; $attempt++) {
            try {
                // Send the status notification only to the affected user.
                Mail::to($user->email)->send(new UserStatusMail($user, $status, $approvedBy));

                // Logging to DB is best-effort; do not mark send as failed
                // if EmailLog persistence fails.
                try {
                    EmailLog::create([
                        'user_id' => $user->userID,
                        'email' => $user->email,
                        'type' => $status,
                        'status' => 'success',
                        'sent_at' => now(),
                    ]);
                } catch (\Throwable $logError) {
                    Log::warning('Status email sent but EmailLog insert failed', [
                        'user_id' => $user->userID,
                        'email' => $user->email,
                        'status' => $status,
                        'error' => $logError->getMessage(),
                    ]);
                }

                return true;
            } catch (\Throwable $e) {
                // Keep the latest transport error for final failure logging.
                $lastError = $e;
            }
        }

        try {
            EmailLog::create([
                'user_id' => $user->userID,
                'email' => $user->email,
                'type' => $status,
                'status' => 'failed',
                'error_message' => $lastError ? $lastError->getMessage() : 'Unknown mail error',
                'sent_at' => now(),
            ]);
        } catch (\Throwable $logError) {
            Log::error('Status email failed and EmailLog insert failed', [
                'user_id' => $user->userID,
                'email' => $user->email,
                'status' => $status,
                'mail_error' => $lastError ? $lastError->getMessage() : 'Unknown mail error',
                'log_error' => $logError->getMessage(),
            ]);
        }

        return false;
    }

    /**
     * Send exam completion notification.
     */
    public function sendExamCompletionNotification($user, $score, $examName = 'Applied Power Electronics', $performanceSummary = [])
    {
        try {
            // Queue is used here so exam flows are not blocked by SMTP latency.
            Mail::to($user->email)->queue(new ExamCompletionMail($user, $score, $examName, $performanceSummary));

            EmailLog::create([
                'user_id' => $user->userID,
                'email' => $user->email,
                'type' => 'exam_completion',
                'status' => 'success',
                'sent_at' => now(),
            ]);

            return true;
        } catch (\Throwable $e) {
            try {
                // Best-effort failure audit; sending already failed at this point.
                EmailLog::create([
                    'user_id' => $user->userID,
                    'email' => $user->email,
                    'type' => 'exam_completion',
                    'status' => 'failed',
                    'error_message' => $e->getMessage(),
                    'sent_at' => now(),
                ]);
            } catch (\Throwable $logError) {
                // Avoid bubbling logging failures to callers.
                Log::error('Exam completion email failed and EmailLog insert failed', [
                    'user_id' => $user->userID,
                    'email' => $user->email,
                    'mail_error' => $e->getMessage(),
                    'log_error' => $logError->getMessage(),
                ]);
            }

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
            try {
                // Record failure details for support/admin troubleshooting.
                EmailLog::create([
                    'user_id' => $user->userID,
                    'email' => config('mail.from.address', 'admin@caps.edu.ph'),
                    'type' => 'support_ticket_admin_alert',
                    'status' => 'failed',
                    'error_message' => $e->getMessage(),
                    'sent_at' => now(),
                ]);
            } catch (\Throwable $logError) {
                Log::error('Support ticket email failed and EmailLog insert failed', [
                    'user_id' => $user->userID,
                    'email' => config('mail.from.address', 'admin@caps.edu.ph'),
                    'mail_error' => $e->getMessage(),
                    'log_error' => $logError->getMessage(),
                ]);
            }

            return false;
        }
    }
}

