<!DOCTYPE html>
<html>

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Support Ticket</title>
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
                                                        style="color:#ffffff; font-size:14px; font-weight:bold;">!</span>
                                                </td>
                                                <td
                                                    style="padding-left:10px; font-size:17px; font-weight:bold; color:#1a1a1a; vertical-align:middle;">
                                                    CAPS Admin</td>
                                            </tr>
                                        </table>
                                    </td>
                                    <td align="right">
                                        <span style="font-size:22px;">🛠️</span>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Banner -->
                    <tr>
                        <td style="padding: 20px 20px 0;">
                            <table width="100%" cellpadding="0" cellspacing="0"
                                style="background-color:#2c3e50; border-radius:14px; overflow:hidden;">
                                <tr>
                                    <td style="padding: 28px 30px 32px;">
                                        <p
                                            style="margin:0 0 8px; font-size:11px; font-weight:bold; color:#95a5a6; letter-spacing:1.5px; text-transform:uppercase;">
                                            New Support Request</p>
                                        <p
                                            style="margin:0; font-size:26px; font-weight:bold; color:#ffffff; line-height:1.3;">
                                            {{ $ticket->subject }}</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Student Info -->
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
                                        <p style="margin:0; font-size:16px; font-weight:bold; color:#1a1a1a;">
                                            {{ $user->firstName }} {{ $user->lastName }}
                                        </p>
                                        <p style="margin:4px 0 0; font-size:13px; color:#888888;">{{ $user->email }}</p>
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

                    <!-- Ticket Details -->
                    <tr>
                        <td style="padding: 20px 28px;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td style="padding-bottom: 15px;">
                                        <p style="margin:0 0 4px; font-size:11px; font-weight:bold; color:#aaaaaa; letter-spacing:1px; text-transform:uppercase;">Category</p>
                                        <p style="margin:0; font-size:14px; color:#1a1a1a; font-weight:bold;">{{ ucfirst($ticket->category ?? 'General') }}</p>
                                    </td>
                                    <td style="padding-bottom: 15px;">
                                        <p style="margin:0 0 4px; font-size:11px; font-weight:bold; color:#aaaaaa; letter-spacing:1px; text-transform:uppercase;">Status</p>
                                        <p style="margin:0; font-size:14px; color:#FE6902; font-weight:bold;">{{ ucfirst($ticket->status ?? 'Open') }}</p>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="margin:10px 0 8px; font-size:11px; font-weight:bold; color:#aaaaaa; letter-spacing:1px; text-transform:uppercase;">Description</p>
                            <div style="background-color:#fdfdfd; border:1px solid #eee; border-radius:8px; padding:15px; font-size:14px; color:#444444; line-height:1.6;">
                                {{ $ticket->description ?? $ticket->message }}
                            </div>
                        </td>
                    </tr>

                    <!-- Divider -->
                    <tr>
                        <td style="padding: 0 28px;">
                            <hr style="border:none; border-top:1px solid #eeeeee; margin:0;">
                        </td>
                    </tr>

                    <!-- Action Button -->
                    <tr>
                        <td style="padding: 24px 20px 20px;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="background-color:#FE6902; border-radius:10px;">
                                        <a href="{{ env('FRONTEND_URL', 'http://192.168.254.114.nip.io:5173') }}/admin/support/tickets"
                                            style="display:block; padding:16px; color:#ffffff; font-size:15px; font-weight:bold; text-decoration:none; text-align:center; border-radius:10px;">
                                            Manage Ticket
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
                                This is an automated administrative alert.
                            </p>
                            <p style="margin:6px 0 0; font-size:12px; color:#aaaaaa;">
                                &copy; {{ date('Y') }} CAPS System Administration.
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>

</html>
