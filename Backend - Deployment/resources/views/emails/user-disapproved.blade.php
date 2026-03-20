<!DOCTYPE html>
<html>
<head>
    <title>Account Disapproved</title>
</head>
<body>
    <h2>Your Account Has Been Disapproved</h2>
    <p>Hello {{ $user->firstName }},</p>
    <p>We regret to inform you that your account has been disapproved.</p>
    @if($reason)
    <p><strong>Reason:</strong> {{ $reason }}</p>
    @endif
    <p>Please contact the administration for more information.</p>
    <p>Best regards,<br>CAPS Administration</p>
</body>
</html>