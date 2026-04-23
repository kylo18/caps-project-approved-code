<!DOCTYPE html>
<html>

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Account Status Update</title>
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

                    @if($status === 'approved')
                        <!-- Approved Banner -->
                        <tr>
                            <td style="padding: 20px 20px 0;">
                                <table width="100%" cellpadding="0" cellspacing="0"
                                    style="background-color:#FE6902; border-radius:14px; overflow:hidden;">
                                    <tr>
                                        <td style="padding: 28px 30px 32px;">
                                            <p
                                                style="margin:0 0 8px; font-size:11px; font-weight:bold; color:#ffe0c2; letter-spacing:1.5px; text-transform:uppercase;">
                                                Account Status</p>
                                            <p
                                                style="margin:0; font-size:26px; font-weight:bold; color:#ffffff; line-height:1.3;">
                                                Your account has been approved!</p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>

                        <!-- User Info -->
                        <tr>
                            <td style="padding: 24px 28px 0;">
                                <table cellpadding="0" cellspacing="0">
                                    <tr>
                                        <td style="vertical-align:middle;">
                                            <div
                                                style="width:52px; height:52px; border-radius:50%; background-color:#e0e0e0; text-align:center; line-height:52px; font-size:26px;">
                                                👤
                                            </div>
                                        </td>
                                        <td style="padding-left:14px; vertical-align:middle;">
                                            <p style="margin:0; font-size:16px; font-weight:bold; color:#1a1a1a;">Hello,
                                                {{ $user->firstName }}
                                            </p>
                                            <p style="margin:4px 0 0; font-size:13px; color:#888888;">Student account</p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>

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
                                    We are pleased to inform you that your account in the <strong>CAPS</strong> has
                                    been
                                    <span style="color:green; font-weight:bold;">approved</span> by an authorized administrator.
                                </p>
                                <p style="margin:12px 0 0; font-size:14px; color:#444444; line-height:1.7;">
                                    <strong>Approver:</strong> <span style="color:#1a1a1a;">{{ $approvedBy }}</span>
                                </p>
                                <p style="margin:8px 0 0; font-size:13px; color:#666666; line-height:1.6;">
                                    Your account has been verified and approved in accordance with your assigned role and institutional responsibilities. You can now log in and access all features of the system.
                                </p>
                            </td>
                        </tr>

                        <!-- Divider -->
                        <tr>
                            <td style="padding: 0 28px;">
                                <hr style="border:none; border-top:1px solid #eeeeee; margin:0;">
                            </td>
                        </tr>

                        <!-- Approved By - Role and Identity -->
                        <tr>
                            <td align="center" style="padding: 20px 28px; background-color:#fafafa;">
                                <p
                                    style="margin:0 0 4px; font-size:11px; font-weight:bold; color:#aaaaaa; letter-spacing:1.5px; text-transform:uppercase;">
                                    Approval Authority</p>
                                <p style="margin:0 0 6px; font-size:15px; font-weight:bold; color:#1a1a1a;">{{ $approvedBy }}</p>
                                <p style="margin:0; font-size:12px; color:#666666;">
                                    <span style="font-size:11px; color:#888888;">✓ Authorized by institutional role</span>
                                </p>
                            </td>
                        </tr>

                        <!-- Login Button -->
                        <tr>
                            <td style="padding: 0 20px 20px;">
                                <table width="100%" cellpadding="0" cellspacing="0">
                                    <tr>
                                        <td align="center" style="background-color:#FE6902; border-radius:10px;">
                                            <a href="{{ env('FRONTEND_URL', 'http://192.168.254.114.nip.io:5173') }}/login"
                                                style="display:block; padding:16px; color:#ffffff; font-size:15px; font-weight:bold; text-decoration:none; text-align:center; border-radius:10px;">
                                                Login to CAPS
                                            </a>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>

                    @else
                        <!-- Disapproved Banner -->
                        <tr>
                            <td style="padding: 20px 20px 0;">
                                <table width="100%" cellpadding="0" cellspacing="0"
                                    style="background-color:#ef4444; border-radius:14px; overflow:hidden;">
                                    <tr>
                                        <td style="padding: 28px 30px 32px;">
                                            <p
                                                style="margin:0 0 8px; font-size:11px; font-weight:bold; color:#fecaca; letter-spacing:1.5px; text-transform:uppercase;">
                                                Account Status</p>
                                            <p
                                                style="margin:0; font-size:26px; font-weight:bold; color:#ffffff; line-height:1.3;">
                                                Your account request has been disapproved.</p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>

                        <!-- User Info -->
                        <tr>
                            <td style="padding: 24px 28px 0;">
                                <table cellpadding="0" cellspacing="0">
                                    <tr>
                                        <td style="vertical-align:middle;">
                                            <div
                                                style="width:52px; height:52px; border-radius:50%; background-color:#e0e0e0; text-align:center; line-height:52px; font-size:26px;">
                                                👤
                                            </div>
                                        </td>
                                        <td style="padding-left:14px; vertical-align:middle;">
                                            <p style="margin:0; font-size:16px; font-weight:bold; color:#1a1a1a;">Hello,
                                                {{ $user->firstName }}
                                            </p>
                                            <p style="margin:4px 0 0; font-size:13px; color:#888888;">Student account</p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>

                        <!-- Divider -->
                        <tr>
                            <td style="padding: 20px 28px 0;">
                                <hr style="border:none; border-top:1px solid #eeeeee; margin:0;">
                            </td>
                        </tr>

                        <!-- Body Message -->
                        <tr>
                            <td style="padding: 20px 28px;">
                                <p style="margin:0 0 16px; font-size:14px; color:#444444; line-height:1.7;">
                                    Thank you for your interest in the <strong>CAPS</strong>. Unfortunately, your
                                    account request has been <span
                                        style="color:#ef4444; font-weight:bold;">disapproved</span> at this time.
                                </p>
                                <div
                                    style="background-color:#fef2f2; border-left:4px solid #ef4444; border-radius:4px; padding:14px 16px;">
                                    <p style="margin:0; font-size:13px; color:#b91c1c;">
                                        If you believe this is an error, please contact your administrator for further
                                        assistance.
                                    </p>
                                </div>
                            </td>
                        </tr>

                    @endif

                    <!-- Divider -->
                    <tr>
                        <td style="padding: 0 28px;">
                            <hr style="border:none; border-top:1px solid #eeeeee; margin:0;">
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