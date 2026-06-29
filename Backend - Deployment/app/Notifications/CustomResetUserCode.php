<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class CustomResetUserCode extends Notification
{
    use Queueable;

    public function __construct(public string $token)
    {
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $frontendUrl = config('app.frontend_url', config('app.url'));
        $url = "{$frontendUrl}/reset-user-code?token={$this->token}&email=" . urlencode($notifiable->email);

        return (new MailMessage())
            ->subject('Reset Your User Code')
            ->line('You are receiving this email because we received a user code reset request for your account.')
            ->line('Click the button below to set a new user code.')
            ->action('Reset User Code', $url)
            ->line('If you did not request a user code reset, no further action is required.');
    }
}
