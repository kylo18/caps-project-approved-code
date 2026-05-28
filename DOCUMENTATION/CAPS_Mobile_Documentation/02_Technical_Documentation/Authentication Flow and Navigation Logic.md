# Authentication Flow and Navigation Logic

## Purpose
This document describes the authentication flow and navigation structure implemented in the CAPS mobile frontend. It focuses on the current `FrontendMobile` Expo Router setup and explains how auth state, role validation, and route guarding work together.

## Scope
- `FrontendMobile/app/_layout.tsx`
- `FrontendMobile/app/(auth)/_layout.tsx`
- `FrontendMobile/app/(auth)/...` role-specific layouts
- `FrontendMobile/src/utils/logoutUser.ts`
- `FrontendMobile/src/services/apiClient.ts`
- Role-based dashboards and tab navigation

## App bootstrap and auth state

### App root
The root app layout is `FrontendMobile/app/_layout.tsx`.
- Registers global providers: Redux store, theme provider, safe area, gesture handler.
- Loads fonts and hides the splash screen once ready.
- Defines top-level routes for:
  - `/` login/index
  - `/register`
  - `/forgot-password`
  - `/reset-password`
  - `/team-caps`
  - `/(auth)` authenticated app flow

### Auth persistence
- Authentication tokens and user metadata are persisted in Expo SecureStore.
- Logged-in credentials are stored under keys such as `token`, `user`, and `pushToken`.
- On app launch, the app uses this stored state to determine whether the user can enter the authenticated section.

## Login and session flow

### Successful login
1. User submits credentials on the login screen.
2. The login service sends `POST /api/login` using `FrontendMobile/src/services/apiClient.ts`.
3. On success, the app stores the returned token and user object in SecureStore.
4. Redux auth state is updated to mark the user as authenticated.
5. The app navigates into the authenticated layout: `/(auth)`.

### Token and profile refresh
- Auth token is included automatically in API requests when `auth` is enabled.
- The app keeps user profile and `roleID` in Redux state to drive role-based routing.
- If the backend returns `401`, the app triggers the logout flow and redirects to `/`.

### Logout behavior
- Logout is centralized in `FrontendMobile/src/utils/logoutUser.ts`.
- It deletes auth-related SecureStore keys and unregisters push notification tokens.
- `app/_layout.tsx` also registers a `401 Unauthorized` callback using `registerUnauthorizedCallback(...)`.
- When triggered, the callback dispatches a Redux logout and routes the user back to the login screen.

## Authenticated route layout

### `app/(auth)/_layout.tsx`
This file is the authenticated route wrapper.
- It checks `isAuthenticated` from Redux.
- It redirects unauthenticated users to `/`.
- It uses `usePathname()` plus a role mapping to guard against role mismatch.
- If a user enters the wrong role group layout, it redirects them to the correct dashboard route.

### `ROUTE_ROLE_MAP` and route validation
The authenticated layout derives the expected role from path segments such as:
- `/(auth)/(student)/...`
- `/(auth)/(faculty)/...`
- `/(auth)/(program-chair)/...`
- `/(auth)/(dean)/...`
- `/(auth)/(associate-dean)/...`

If the current `roleID` does not match the intended role group, the layout redirects to the correct dashboard using `getDashboardRoute(roleID)`.

## Role-based navigation structure

### Student navigation
- Defined by `FrontendMobile/app/(auth)/(student)/_layout.tsx`
- Uses Expo Router `Tabs` and a custom `StudentTabBar`
- Top-level tabs:
  - `dashboard`
  - `classes`
  - `leaderboard`
  - `insights`

### Faculty, program chair, dean, associate dean
- Each role has its own `app/(auth)/(<role>)/_layout.tsx` layout file.
- Each layout contains the role-specific tab structure and screens for that role.
- This keeps navigation isolated per role while sharing the same authenticated wrapper.

### Hidden and deep-linked screens
Some role layouts configure hidden routes for screens that are accessed via deep links or programmatic navigation. Examples include:
- `search`
- `bookmarks`
- `practice-history`
- `class-detail`

These screens are not shown in the main tab bar but remain accessible when the app pushes their route.

## Navigation guard details

### Wrong role fallback
- The app prevents role-crossing by validating the role from the URL and Redux state.
- If the path belongs to a different role group, the authenticated layout redirects.
- This ensures a faculty user cannot remain on a student route or vice versa.

### Unauthenticated fallback
- If the token is missing or auth is invalid, the authenticated layout redirects to `/`.
- This is the first guard before any role logic executes.

### Unauthorized API fallback
- `FrontendMobile/src/services/apiClient.ts` calls the registered `401` callback when it receives unauthorized responses.
- This forces a clean logout and prevents stale auth state from being reused.

## Key files referenced
- `FrontendMobile/app/_layout.tsx`
- `FrontendMobile/app/(auth)/_layout.tsx`
- `FrontendMobile/app/(auth)/(student)/_layout.tsx`
- `FrontendMobile/src/utils/roleValidation.ts`
- `FrontendMobile/src/utils/logoutUser.ts`
- `FrontendMobile/src/services/apiClient.ts`
- `FrontendMobile/src/store/slices/authSlice.ts`
- `FrontendMobile/src/features/core/components/OfflineBanner.tsx`

## Notes
- The navigation flow is built on Expo Router rather than manual React Navigation stacks.
- Role-specific layouts are the primary place where mobile role-based routing is enforced.
- The root layout handles global startup, auth callbacks, and notification-driven route pushes.
