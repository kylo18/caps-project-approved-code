# Authentication Flow and Navigation Logic

Archived version: v1.0  
Original location: `../02_Technical_Documentation/Authentication Flow and Navigation Logic.md`

## Purpose
This document describes the first documented authentication and navigation behavior of the CAPS mobile app.

## Scope
- Login screen
- Token storage
- Logout behavior
- Basic role-based navigation
- Protected authenticated screens

## Login flow

1. User opens the CAPS mobile app.
2. User enters account credentials.
3. The app sends the login request to the backend.
4. If the credentials are valid, the app stores the returned token.
5. The app redirects the user to the correct dashboard.

## Token handling

- The token is stored locally after login.
- Authenticated API requests include the token.
- If the token is missing or invalid, the user should return to the login screen.

## Logout flow

1. User selects logout.
2. The app clears the stored token and user data.
3. The app redirects to the login screen.

## Role-based navigation

The app supports separate navigation paths for:

- Student
- Faculty
- Program Chair
- Dean
- Associate Dean

Each role should only access screens that match its permissions.

## Earlier limitations

- Route fallback behavior was documented only at a high level.
- Detailed Expo Router layout behavior was not yet included.
- Unauthorized API callback behavior was not yet fully described.

## Version control note

This archived version was kept before the authentication documentation was expanded with route guards, role mappings, and detailed authenticated layout behavior.

