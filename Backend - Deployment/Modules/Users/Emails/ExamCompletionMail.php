<?php

namespace Modules\Users\Emails;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ExamCompletionMail extends Mailable
{
    use Queueable, SerializesModels;

    public $user;
    public $score;
    public $examName;
    public $performanceSummary;

    public function __construct($user, $score, $examName = 'Applied Power Electronics', $performanceSummary = [])
    {
        $this->user = $user;
        $this->score = $score;
        $this->examName = $examName;
        $this->performanceSummary = $performanceSummary;
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "You've Completed Your Exam: {$this->examName}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.exam_completion',
        );
    }
}
