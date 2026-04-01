<!DOCTYPE html>
<html>
<head>
    <title>Exam Completed</title>
</head>
<body>
    <h1>Great job, {{ $user->firstName }}!</h1>
    
    <p>You have successfully completed the exam: <strong>{{ $examName }}</strong>.</p>
    
    <div style="padding: 20px; background-color: #f4f4f4; border-radius: 8px; margin: 20px 0;">
        <p style="font-size: 18px; margin-bottom: 5px;">Your Overall Score:</p>
        <p style="font-size: 32px; font-weight: bold; color: #4CAF50;">{{ $score }}%</p>
    </div>

    <p>You can view your detailed analytics and recommendations on the CAPS dashboard.</p>
    <a href="{{ url('/') }}" style="padding: 10px 20px; background-color: #2196F3; color: white; text-decoration: none; border-radius: 5px;">View Full Results</a>

    <p>Keep up the great work!<br>The CAPS Team</p>
</body>
</html>
