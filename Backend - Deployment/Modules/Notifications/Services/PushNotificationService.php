<?php

namespace Modules\Notifications\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PushNotificationService
{
    private string $expoPushUrl = 'https://exp.host/--/api/v2/push/send';

    public function sendToUsers(array $userIds, string $title, string $message, array $data = []): array
    {
        $userIds = array_values(array_unique(array_filter($userIds, fn ($id) => !empty($id))));

        if (empty($userIds)) {
            return ['sent' => 0, 'failed' => 0];
        }

        $tokens = DB::table('push_tokens')
            ->whereIn('user_id', $userIds)
            ->pluck('token')
            ->filter()
            ->unique()
            ->values()
            ->all();

        return $this->send($tokens, $title, $message, $data);
    }

    public function send(array $tokens, string $title, string $message, array $data = []): array
    {
        $tokens = array_values(array_unique(array_filter($tokens)));

        if (empty($tokens)) {
            return ['sent' => 0, 'failed' => 0];
        }

        $payloads = array_map(function (string $token) use ($title, $message, $data) {
            return [
                'to' => $token,
                'title' => $title,
                'body' => $message,
                'data' => $data,
                'sound' => 'default',
                'channelId' => 'default',
                'priority' => 'high',
                'ttl' => 604800,
            ];
        }, $tokens);

        try {
            $response = Http::timeout(15)
                ->acceptJson()
                ->post($this->expoPushUrl, $payloads);

            if ($response->failed()) {
                Log::error('Expo push send failed', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);

                return ['sent' => 0, 'failed' => count($tokens)];
            }

            $result = $response->json();
            $tickets = $result['data'] ?? [];
            $sent = 0;
            $failed = 0;

            foreach ($tickets as $index => $ticket) {
                if (($ticket['status'] ?? null) === 'ok') {
                    $sent++;
                    continue;
                }

                $failed++;
                $detailsError = strtolower((string) ($ticket['details']['error'] ?? ''));
                if ($detailsError === 'devicenotregistered' && isset($tokens[$index])) {
                    DB::table('push_tokens')
                        ->where('token', $tokens[$index])
                        ->delete();
                }
            }

            return ['sent' => $sent, 'failed' => $failed];
        } catch (\Throwable $e) {
            Log::error('Push notification exception: ' . $e->getMessage());
            return ['sent' => 0, 'failed' => count($tokens)];
        }
    }
}
