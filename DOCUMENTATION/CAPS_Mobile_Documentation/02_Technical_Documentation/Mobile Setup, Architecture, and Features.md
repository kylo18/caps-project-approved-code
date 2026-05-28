# Mobile Setup, Architecture, and Features

## Purpose
This document describes the current CAPS mobile frontend as implemented in the `FrontendMobile` folder. It covers setup, runtime configuration, app architecture, navigation, state management, API behavior, and the main role-based features.

## Mobile Scope
This document is written for the CAPS mobile app only and reflects the current `FrontendMobile` implementation. It does not describe web-only or backend-only behavior.

Last updated: May 27, 2026

This document has been reviewed and updated for the current CAPS mobile system.

---

## Project Location
Mobile frontend root:

```text
FrontendMobile/
```

The app is an Expo React Native application using Expo Router. The main route entry is configured in `package.json` as:

```json
"main": "expo-router/entry"
```

---

## Setup

### Required tools
- Node.js LTS
- npm
- Expo development tooling
- Android device, emulator, or Expo-compatible test device

### Install dependencies
Run commands from `FrontendMobile`:

```bash
npm install
```

The project uses `patch-package`, so `npm install` also applies local package patches through the `postinstall` script.

### Environment variables
`app.config.js` requires these values:

```env
EXPO_PUBLIC_API_URL=
EXPO_PUBLIC_AI_SERVICE_URL=
EXPO_PUBLIC_EAS_PROJECT_ID=
EXPO_PUBLIC_ANDROID_VERSION_CODE=
```

Required at startup:
- `EXPO_PUBLIC_API_URL`
- `EXPO_PUBLIC_AI_SERVICE_URL`

If either required value is missing, `app.config.js` throws an error before the app starts.

### Development scripts
Available scripts in `FrontendMobile/package.json`:

```bash
npm start
npm run android
npm run ios
npm run web
```

The scripts set `REACT_NATIVE_PACKAGER_HOSTNAME=100.91.44.24` and start Expo with LAN hosting. Update the hostname if the development network changes.

### Android release helper
The `build:release` script copies a built release APK into the backend deployment public APK folder when the APK already exists:

```bash
npm run build:release
```

---

## Core Dependencies

The mobile frontend uses:
- Expo SDK 54
- React 19
- React Native 0.81
- Expo Router 6
- Redux Toolkit and React Redux
- Expo SecureStore for token and user persistence
- NativeWind and Tailwind CSS for utility styling
- React Native Gesture Handler, Reanimated, Screens, and Safe Area Context
- Axios is installed, but current app requests are handled through the custom `apiRequest` wrapper around `fetch`
- Expo Notifications for push notification registration and routing
- Expo Local Authentication for biometric login
- React Native Chart Kit and SVG for analytics visualizations

---

## Architecture Overview

The app is organized around Expo Router routes and feature folders:

```text
FrontendMobile/
  app/
    _layout.tsx
    index.tsx
    register.tsx
    forgot-password.tsx
    reset-password.tsx
    team-caps.tsx
    (auth)/
      _layout.tsx
      (student)/
      (faculty)/
      (program-chair)/
      (dean)/
      (associate-dean)/
      practice-exam/
  src/
    contexts/
    features/
      admin/
      classes/
      core/
      notifications/
      practice/
      profile/
      student/
      subjects/
      support/
    hooks/
    services/
    store/
    types/
    utils/
```

### Root layout
`app/_layout.tsx` bootstraps the application with:
- `GestureHandlerRootView`
- `SafeAreaProvider`
- Redux `Provider`
- `ThemeProvider`
- Expo font loading for Rubik
- splash-screen control
- Toast configuration
- global unauthorized handling
- offline sync listener
- push notification setup
- app update check and force-update modal

### Authenticated layout
`app/(auth)/_layout.tsx` acts as the authenticated route wrapper. It:
- redirects unauthenticated users to `/`
- checks the current route group against the logged-in role
- redirects role mismatches to the correct dashboard
- renders the shared `OfflineBanner`
- applies role-aware light or dark page colors

### State management
Global state is stored in Redux:

```text
src/store/
  index.ts
  slices/
    authSlice.ts
    examSlice.ts
    uiSlice.ts
```

`authSlice.ts` stores:
- current user
- token
- authentication state
- loading state

Token and user persistence are handled outside the reducer through SecureStore in the login and logout flows.

### API layer
All mobile API calls should go through:

```text
src/services/apiClient.ts
```

`apiRequest(...)` handles:
- base URL from `EXPO_PUBLIC_API_URL`
- JSON request headers
- bearer token injection from SecureStore
- request timeouts
- `401` logout handling
- `GET` response caching
- cached fallback when the server is unreachable
- offline queueing for non-GET mutations
- offline queue sync after reconnection

Timeouts are adjusted by request type:
- 60 seconds for leaderboard requests
- 45 seconds for analytics or insights requests
- 30 seconds for other requests

---

## Navigation and Roles

Role IDs are defined in `src/types/index.ts`:

| Role ID | Role |
|---:|---|
| 1 | Student |
| 2 | Faculty |
| 3 | Program Chair |
| 4 | Dean |
| 5 | Associate Dean |

Dashboard routing is centralized in `src/utils/roleValidation.ts`.

### Public routes
- `/` - login
- `/register` - registration
- `/forgot-password` - password reset request
- `/reset-password` - password reset completion
- `/team-caps` - team page
- `/auth/google/callback` - Google OAuth callback
- `/auth/facebook/callback` - Facebook OAuth callback

### Student tabs
`app/(auth)/(student)/_layout.tsx` shows:
- Home
- Classes
- Leaderboard
- Profile

Hidden student routes include search, bookmarks, practice history, strong areas, weak areas, time per topic, class detail, and frequently mistaken screens.

### Faculty tabs
Faculty uses `RoleTabBar` with:
- Home
- Subjects
- Classes
- Profile

Hidden routes include users, reports, insights, class detail, create announcement, and archived classes.

### Program Chair tabs
Program Chair follows the same admin-style route structure with role-scoped users, subjects, classes, reports, insights, announcements, profile, and archived classes.

### Dean and Associate Dean tabs
Dean and Associate Dean layouts use `RoleTabBar` and `AdminFloatingTools`.

Dean visible tabs:
- Home
- Subjects
- Classes
- Enhancement
- Profile

Hidden dean routes include users, analytics, reports, insights, support, create announcement, class detail, and archived classes.

Associate Dean follows a similar administrator layout with analytics and enhancement routes.

---

## Main Features

### Authentication
Implemented in `app/index.tsx` and related auth routes:
- user-code and password login through `POST /api/login`
- token and user storage in SecureStore
- remember-me support
- biometric prompt after successful remember-me login
- OAuth callback handling for Google and Facebook
- forgot-password and reset-password flows
- automatic profile validation for stored sessions through `GET /api/user/profile`

### Student features
Students can:
- view dashboard subjects and progress
- search practice subjects
- generate and take practice exams
- review practice exam results
- join and view classes
- take class quizzes
- view class quiz results and history
- use bookmarks
- view practice history
- inspect strong areas, weak areas, time per topic, and frequently mistaken topics
- view leaderboards with period, program, and subject filters
- open Help Center FAQs and submit support requests

### Faculty features
Faculty users can:
- view dashboard data
- manage assigned classes
- view class details and quiz activity
- view assigned subjects and questions
- view user lists with filtering
- create announcements
- view profile and archived classes

### Program Chair features
Program Chairs can:
- manage scoped users
- manage subjects and questions
- approve pending questions
- filter subjects by program and year level
- work with classes and archived classes
- access reports and insights
- create announcements

### Dean and Associate Dean features
Deans and Associate Deans can:
- view administrative dashboards
- manage users with approval and status actions
- manage subjects, questions, classes, and archived classes
- open analytics and reports
- use the unified enhancement workspace
- review support tickets
- create announcements
- use floating admin tools for quick actions

### Notifications
Notification support is implemented in `src/services/notificationService.ts`.

The app supports:
- push token registration
- backend push token registration
- notification receive listeners
- notification tap routing through action URLs
- notification list retrieval
- mark-read and mark-all-read actions
- notification deletion
- unread count retrieval

Push notification setup is skipped in Expo Go when unsupported.

### Offline behavior
The app includes:
- `OfflineBanner`
- cached `GET` responses
- offline mutation queueing
- automatic sync attempt when the connection returns
- local cleanup for orphaned exam keys during app startup

---

## Build and Runtime Configuration

`app.config.js` configures:
- app name: `CAPS`
- scheme: `caps`
- portrait orientation
- automatic light/dark interface style
- Android package: `com.caps.mobile`
- iOS bundle identifier: `com.caps.mobile`
- splash and app icons
- EAS project ID
- Android notification and install permissions
- SecureStore, localization, notifications, router, font, local auth, and splash plugins

The app version is read from:

```text
Backend - Deployment/version.json
```

---

## Maintenance Notes

- Keep this documentation aligned with `FrontendMobile`, not the web frontend or backend implementation.
- Add new screens to the matching role route group under `app/(auth)`.
- Put reusable domain UI under `src/features/<feature>`.
- Put shared services under `src/services`.
- Use `apiRequest(...)` for backend communication so authentication, cache, offline behavior, and unauthorized handling remain consistent.
- Update route and role documentation whenever a layout file changes.

---

*End of Document*
