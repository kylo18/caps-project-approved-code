# API Setup and Environment Configuration

Archived version: v1.0  
Original location: `../02_Technical_Documentation/API Setup and Environment Configuration.md`

## Purpose
This document explains the first setup notes for connecting the CAPS mobile app to the backend API.

## Scope
- `FrontendMobile/.env`
- `FrontendMobile/.env.example`
- Mobile API base URL
- Local development setup

## Environment setup

1. Go to the `FrontendMobile` folder.
2. Copy `.env.example` and rename the copy to `.env`.
3. Add the backend API URL.
4. Add the AI service URL when available.

Example:

```env
EXPO_PUBLIC_API_URL=http://localhost:8000
EXPO_PUBLIC_AI_SERVICE_URL=http://localhost:8001
```

## Local device testing

When testing on a physical Android device, replace `localhost` with the local network IP address of the computer running the backend.

Example:

```env
EXPO_PUBLIC_API_URL=http://192.168.1.10:8000
```

## API usage notes

- The mobile app uses the configured API URL when sending requests to the backend.
- The API URL should match the active testing or production environment.
- If the URL is incorrect, login and data loading will fail.

## Version control note

- Do not commit `.env` files because they may contain private or environment-specific values.
- Use `.env.example` to document required keys.
- Keep this archived file as the first version before later updates.

