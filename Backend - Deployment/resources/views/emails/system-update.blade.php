<!DOCTYPE html>
<html>

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $title }}</title>
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
                                                        style="color:#ffffff; font-size:14px; font-weight:bold;">📢</span>
                                                </td>
                                                <td
                                                    style="padding-left:10px; font-size:17px; font-weight:bold; color:#1a1a1a; vertical-align:middle;">
                                                    CAPS Announcement</td>
                                            </tr>
                                        </table>
                                    </td>
                                    <td align="right">
                                        <span style="font-size:22px;">🔔</span>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Banner -->
                    <tr>
                        <td style="padding: 20px 20px 0;">
                            <table width="100%" cellpadding="0" cellspacing="0"
                                style="background-color:#FE6902; border-radius:14px; overflow:hidden;">
                                <tr>
                                    <td style="padding: 28px 30px 32px;">
                                        <p
                                            style="margin:0 0 8px; font-size:11px; font-weight:bold; color:#ffe0c2; letter-spacing:1.5px; text-transform:uppercase;">
                                            Official System Update</p>
                                        <p
                                            style="margin:0; font-size:26px; font-weight:bold; color:#ffffff; line-height:1.3;">
                                            {{ $title }}</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td style="padding: 30px 28px;">
                            <div style="font-size:15px; color:#444444; line-height:1.8; white-space: pre-wrap;">
{!! $content !!}
                            </div>
                        </td>
                    </tr>

                    <!-- Divider -->
                    <tr>
                        <td style="padding: 0 28px;">
                            <hr style="border:none; border-top:1px solid #eeeeee; margin:0;">
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td align="center" style="padding: 30px 28px 28px;">
                            <p style="margin:0; font-size:13px; font-weight:bold; color:#1a1a1a;">
                                CAPS Administration Team
                            </p>
                            <p style="margin:10px 0 0; font-size:12px; color:#aaaaaa;">
                                You are receiving this because you are a registered user of the CAPS platform.
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