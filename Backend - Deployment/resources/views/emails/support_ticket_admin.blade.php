<!DOCTYPE html>
<html>
<head>
    <title>New Support Ticket</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <h2 style="color: #2c3e50;">New Support Ticket Submitted</h2>
    <p>A student has submitted a new support request.</p>
    
    <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; border-left: 4px solid #3498db;">
        <p><strong>From:</strong> {{ $user->firstName }} {{ $user->lastName }} ({{ $user->email }})</p>
        <p><strong>Issue Type:</strong> {{ $ticket->issue_type }}</p>
        <p><strong>Subject:</strong> {{ $ticket->subject }}</p>
    </div>

    <br>
    <p><strong>Message:</strong></p>
    <div style="background: #fdfdfd; padding: 15px; border: 1px solid #ddd; border-radius: 5px;">
        <p>{{ $ticket->message }}</p>
    </div>

    <br>
    <p style="color: #7f8c8d; font-size: 0.9em;">Please log in to the CAPS Admin Dashboard to review and manage this ticket.</p>
</body>
</html>
