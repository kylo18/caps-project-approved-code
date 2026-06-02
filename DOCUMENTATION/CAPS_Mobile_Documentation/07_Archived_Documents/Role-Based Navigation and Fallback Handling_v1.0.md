# Role-Based Navigation and Fallback Handling

Archived version: v1.0  
Original location: `../02_Technical_Documentation/Role-Based Navigation and Fallback Handling.md`

## Purpose
This document records the first notes for how CAPS mobile handles role-based navigation and fallback screens.

## Supported roles

- Student
- Faculty
- Program Chair
- Dean
- Associate Dean

## Basic navigation rule

After login, the app sends the user to the dashboard that matches the user's role.

Example:

| Role | Expected destination |
| --- | --- |
| Student | Student dashboard |
| Faculty | Faculty dashboard |
| Program Chair | Program Chair dashboard |
| Dean | Dean dashboard |
| Associate Dean | Associate Dean dashboard |

## Fallback behavior

If a user attempts to open a screen outside their role, the app should redirect the user back to an allowed screen.

## Initial route handling notes

- Authenticated users should stay inside authenticated routes.
- Unauthenticated users should return to the login screen.
- Role mismatch should redirect to the correct role dashboard.

## Earlier limitations

- Detailed route group examples were not yet included.
- Notification-driven navigation was not yet documented.
- Full fallback handling for hidden routes was not yet described.

## Version control note

This archived version was retained as an earlier baseline before the current documentation added more complete route guard and fallback handling details.

