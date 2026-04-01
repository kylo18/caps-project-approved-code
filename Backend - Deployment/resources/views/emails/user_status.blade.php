<!DOCTYPE html>
<html>
<head>
    <title>Account Status Update</title>
</head>
<body>
    <h1>Hello, {{ $user->firstName }}!</h1>

    @if($status === 'approved')
        <p>We are happy to inform you that your registration for <strong>CAPS</strong> has been approved!</p>
        <p>You can now log in and access all the features of the system.</p>
        <a href="{{ url('/') }}" style="padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">Login Now</a>
    @else
        <p>Thank you for your interest in <strong>CAPS</strong>.</p>
        <p>Unfortunately, your request for an account has been disapproved at this time.</p>
        <p>If you believe this is an error, please contact the administrator.</p>
    @endif

    <p>Best regards,<br>The CAPS Team</p>
</body>
</html>
