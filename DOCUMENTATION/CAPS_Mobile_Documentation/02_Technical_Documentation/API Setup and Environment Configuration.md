# API Setup and Environment Configuration

## Purpose
This document describes how to configure the CAPS mobile frontend environment and API settings. It covers the mobile `FrontendMobile` setup, environment variables, backend API configuration, and startup behavior.

## Scope
- `FrontendMobile/.env.example`
- `FrontendMobile/src/utils/config.ts`
- `FrontendMobile/src/services/apiClient.ts`
- `FrontendMobile/app/_layout.tsx`
- `FrontendMobile/src/utils/logoutUser.ts`

## Environment setup

### Copy the example file
1. In `FrontendMobile`, copy `.env.example` to `.env`.
2. Fill in the correct values for your development or production environment.

### Required variables
The example contains two essential values:
- `EXPO_PUBLIC_API_URL` — the backend API base URL.
- `EXPO_PUBLIC_AI_SERVICE_URL` — the AI service base URL.

Example:
```env
EXPO_PUBLIC_API_URL=http://localhost:8000
EXPO_PUBLIC_AI_SERVICE_URL=http://localhost:8001
```

### Backend API URL guidance
- Use the machine's local network IP for physical devices instead of `localhost`.
- In production, the API URL is expected to point to the live backend domain.
- The mobile app derives the API base URL from `EXPO_PUBLIC_API_URL` for all request calls.

## Runtime configuration

### `FrontendMobile/src/utils/config.ts`
This utility reads and writes local config values using Expo SecureStore.
- `getApiBaseUrl()` reads the stored `apiBaseUrl`.
- `setApiBaseUrl(url)` saves a custom API URL.
- `getAiServiceUrl()` and `setAiServiceUrl(url)` work similarly for the AI service.
- These functions allow the app to preserve runtime overrides outside of the build-time `.env` values.

### SecureStore and runtime persistence
- SecureStore is used for persistent settings such as the auth token, the selected API URL, AI service URL, and other runtime state.
- This is separate from Expo env variables, which are injected at build time.

## API client and authentication

### `FrontendMobile/src/services/apiClient.ts`
This file contains the shared mobile API client.
- Reads the base URL from `EXPO_PUBLIC_API_URL`.
- Adds JSON headers to every request.
- Injects `Authorization: Bearer <token>` when `auth` is required.
- Handles request timeouts, caching, and offline queue behavior.
- Registers a `401 Unauthorized` callback for logout.

### Unauthorized callback
- The root app layout (`app/_layout.tsx`) registers the callback.
- When `apiClient` receives a `401`, it dispatches logout and redirects to `/`.
- This ensures invalid or expired auth sessions are cleared immediately.

## Startup behavior

### App root layout
The root app layout in `FrontendMobile/app/_layout.tsx`:
- Prevents the splash screen from auto-hiding until fonts are loaded.
- Sets up network connectivity listeners for offline queue sync.
- Bootstraps push notifications and handles notification action URLs.
- Registers the global unauthorized callback to enforce auth on API failures.

### Push notification and deep link routing
- On app startup, if a push token is present, the app attempts to register it with the backend.
- Notification responses resolve an `actionUrl` and navigate via `router.push(actionUrl)`.
- This makes deep link routing part of the app startup configuration.

## Production vs development

### Development
- Use the local API URL in `.env`.
- For physical device testing, use the host machine IP.
- Example: `http://192.168.1.10:8000`

### Production
- Point `EXPO_PUBLIC_API_URL` to the production backend domain.
- Point `EXPO_PUBLIC_AI_SERVICE_URL` to the production AI service URL.

## Notes
- Do not edit files outside `FrontendMobile` when configuring the mobile environment.
- Keep `.env` values private and avoid committing `.env` to version control.
- Use `.env.example` as the source of truth for required mobile environment keys.

## Referenced files
- `FrontendMobile/.env.example`
- `FrontendMobile/src/utils/config.ts`
- `FrontendMobile/src/services/apiClient.ts`
- `FrontendMobile/app/_layout.tsx`
- `FrontendMobile/src/utils/logoutUser.ts`
