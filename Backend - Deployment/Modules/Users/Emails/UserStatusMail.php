<?php

namespace Modules\Users\Emails;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class UserStatusMail extends Mailable
{
    use Queueable, SerializesModels;

    public $user;
    public $status; // 'approved' or 'disapproved'

    public function __construct($user, $status)
    {
        $this->user = $user;
        $this->status = $status;
    }

    public function envelope(): Envelope
    {
        $subject = $this->status === 'approved' 
            ? 'Your CAPS Account has been Approved!' 
            : 'Regarding your CAPS Account Request';

        return new Envelope(
            subject: $subject,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.user_status',
        );
    }
}
