<!DOCTYPE html>
<html>

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Exam Completion Report</title>
</head>

<body style="margin:0; padding:0; background-color:#f0f0f0; font-family: Arial, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f0f0; padding: 40px 0;">
        <tr>
            <td align="center">
                <table width="540" cellpadding="0" cellspacing="0"
                    style="background-color:#ffffff; border-radius:16px; overflow:hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.10);">

                    <!-- Top Nav Bar -->
                    <tr>
                        <td style="padding: 18px 28px; border-bottom: 1px solid #eeeeee;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td>
                                        <table cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td
                                                    style="background-color:#FE6902; border-radius:6px; padding: 5px 8px; vertical-align:middle;">
                                                    <span
                                                        style="color:#ffffff; font-size:14px; font-weight:bold;">✓</span>
                                                </td>
                                                <td
                                                    style="padding-left:10px; font-size:17px; font-weight:bold; color:#1a1a1a; vertical-align:middle;">
                                                    CAPS</td>
                                            </tr>
                                        </table>
                                    </td>
                                    <td align="right">
                                        <span style="font-size:22px;">🌙</span>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Exam Banner -->
                    <tr>
                        <td style="padding: 20px 20px 0;">
                            <table width="100%" cellpadding="0" cellspacing="0"
                                style="background-color:#FE6902; border-radius:14px; overflow:hidden;">
                                <tr>
                                    <td style="padding: 28px 30px 32px;">
                                        <p
                                            style="margin:0 0 8px; font-size:11px; font-weight:bold; color:#ffe0c2; letter-spacing:1.5px; text-transform:uppercase;">
                                            Assessment Completed</p>
                                        <p
                                            style="margin:0; font-size:26px; font-weight:bold; color:#ffffff; line-height:1.3;">
                                            {{ $examName }}</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- User Info & Score -->
                    <tr>
                        <td style="padding: 24px 28px 0;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td style="vertical-align:middle;">
                                        <p style="margin:0; font-size:16px; font-weight:bold; color:#1a1a1a;">Hello,
                                            {{ $user->firstName }}!</p>
                                        <p style="margin:4px 0 0; font-size:13px; color:#888888;">Great job finishing your exam.</p>
                                    </td>
                                    <td align="right" style="vertical-align:middle;">
                                        <div style="background-color:#f8f9fa; padding:10px 15px; border-radius:10px; border:1px solid #eee; text-align:center;">
                                            <p style="margin:0; font-size:11px; color:#888888; text-transform:uppercase; font-weight:bold;">Score</p>
                                            <p style="margin:0; font-size:24px; font-weight:bold; color:#FE6902;">{{ $score }}%</p>
                                        </div>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Performance Summary Section -->
                    @if(!empty($performanceSummary['weak_topics']) || !empty($performanceSummary['recommendations']))
                    <tr>
                        <td style="padding: 24px 28px 0;">
                            <div style="background-color:#fff8f3; border-radius:12px; border:1px solid #ffd8bc; padding:20px;">
                                <p style="margin:0 0 15px; font-size:15px; font-weight:bold; color:#d45500;">
                                    🚀 Performance Summary
                                </p>
                                
                                @if(!empty($performanceSummary['weak_topics']) && count($performanceSummary['weak_topics']) > 0)
                                    <p style="margin:0 0 8px; font-size:13px; font-weight:bold; color:#1a1a1a;">Areas for Improvement:</p>
                                    <ul style="margin:0 0 15px; padding-left:20px; font-size:13px; color:#444444; line-height:1.6;">
                                        @foreach($performanceSummary['weak_topics'] as $topic)
                                            <li>{{ $topic->name }} ({{ $topic->score_pct }}%)</li>
                                        @endforeach
                                    </ul>
                                @endif

                                @if(!empty($performanceSummary['recommendations']) && count($performanceSummary['recommendations']) > 0)
                                    <p style="margin:0 0 8px; font-size:13px; font-weight:bold; color:#1a1a1a;">Recommended Actions:</p>
                                    <ul style="margin:0; padding-left:20px; font-size:13px; color:#444444; line-height:1.6;">
                                        @foreach($performanceSummary['recommendations'] as $rec)
                                            <li>{{ $rec }}</li>
                                        @endforeach
                                    </ul>
                                @endif
                            </div>
                        </td>
                    </tr>
                    @endif

                    <!-- Divider -->
                    <tr>
                        <td style="padding: 20px 28px 0;">
                            <hr style="border:none; border-top:1px solid #eeeeee; margin:0;">
                        </td>
                    </tr>

                    <!-- Body Message -->
                    <tr>
                        <td style="padding: 20px 28px;">
                            <p style="margin:0; font-size:14px; color:#444444; line-height:1.7;">
                                Your detailed analytics have been updated in the dashboard. Use these insights to focus your studies and improve your performance in future assessments.
                            </p>
                        </td>
                    </tr>

                    <!-- Dashboard Button -->
                    <tr>
                        <td style="padding: 0 20px 20px;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="background-color:#FE6902; border-radius:10px;">
                                        <a href="{{ env('FRONTEND_URL', 'http://192.168.254.114.nip.io:5173') }}/student/analytics"
                                            style="display:block; padding:16px; color:#ffffff; font-size:15px; font-weight:bold; text-decoration:none; text-align:center; border-radius:10px;">
                                            View Full Analytics
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td align="center" style="padding: 20px 28px 28px;">
                            <p style="margin:0; font-size:12px; color:#aaaaaa;">
                                This is an automated message from the CAPS. Please do not reply.
                            </p>
                            <p style="margin:6px 0 0; font-size:12px; color:#aaaaaa;">
                                &copy; {{ date('Y') }} CAPS Administration. All rights reserved.
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>

</html>
