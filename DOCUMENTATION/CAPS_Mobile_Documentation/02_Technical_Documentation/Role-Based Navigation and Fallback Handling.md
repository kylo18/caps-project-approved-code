# Role-Based Navigation and Fallback Handling

## Purpose
This document explains how the CAPS mobile frontend implements role-based navigation and fallback handling in the `FrontendMobile` project. It focuses on how the app enforces correct role layouts, handles invalid routes, and recovers from unauthorized or offline conditions.

## Role-based authenticated layout

### Auth wrapper
The authenticated route wrapper is `FrontendMobile/app/(auth)/_layout.tsx`.
- Ensures only authenticated users can access `/(auth)` routes.
- Applies theme and background styling through `ThemeContext`.
- Renders the authenticated child routes via the Expo Router `Slot` component.
- Displays the `OfflineBanner` for connectivity status.

### Role mismatch guard
`app/(auth)/_layout.tsx` uses a `ROUTE_ROLE_MAP` to infer the intended role from the current route.
- Example route groups:
  - `/(auth)/(student)/...`
  - `/(auth)/(faculty)/...`
  - `/(auth)/(program-chair)/...`
  - `/(auth)/(dean)/...`
  - `/(auth)/(associate-dean)/...`
- If the user’s stored `roleID` does not match the route group, the app redirects to the correct dashboard.
- Redirect logic uses `FrontendMobile/src/utils/roleValidation.ts`.

## Role validation and route helpers

### `roleValidation.ts`
Key utilities include:
- `isValidRole(roleID)` — verifies the role ID exists in the known set.
- `getDashboardRoute(roleID)` — returns the correct home route for a role.
- `getExpectedRoleForLayout(layoutName)` — maps layout names to role IDs.

### Role mappings
The app expects the following mappings:
- `1` → `/ (auth)/(student)/dashboard`
- `2` → `/ (auth)/(faculty)/dashboard`
- `3` → `/ (auth)/(program-chair)/dashboard`
- `4` → `/ (auth)/(dean)/dashboard`
- `5` → `/ (auth)/(associate-dean)/dashboard`

## Role-specific layout files

Each role has its own layout directory under `FrontendMobile/app/(auth)`.
- `app/(auth)/(student)/_layout.tsx`
- `app/(auth)/(faculty)/_layout.tsx`
- `app/(auth)/(program-chair)/_layout.tsx`
- `app/(auth)/(dean)/_layout.tsx`
- `app/(auth)/(associate-dean)/_layout.tsx`

Each layout defines the role’s tab structure and top-level feature screens.

### Student tab layout example
The student layout uses:
- `Tabs` from Expo Router
- `StudentTabBar` custom tab bar
- Main tabs: `dashboard`, `classes`, `leaderboard`, `insights`
- Hidden routes for screens accessed via programmatic navigation or deep linking

## Unauthorized and invalid-route fallback

### `401 Unauthorized` handling
- The root layout `FrontendMobile/app/_layout.tsx` registers a callback with the API client.
- When `apiClient` receives a `401`, it triggers logout and redirects to `/`.
- This prevents stale or invalid sessions from staying in the authenticated area.

### Invalid role fallback
- If a role-less user reaches `/(auth)`, the auth wrapper redirects to `/`.
- If a user’s `roleID` is invalid, `getDashboardRoute(roleID)` returns `/`, forcing a return to login.

### Offline fallback
- `OfflineBanner` is rendered inside `app/(auth)/_layout.tsx` so all authenticated screens show connectivity state.
- Offline API behavior is handled separately by `FrontendMobile/src/services/apiClient.ts` and offline queue logic.

## Route safety and UX

### Centralized role enforcement
- The app enforces role safety in one place: the authenticated layout.
- This avoids duplicating role checks in each role-specific screen.

### Stable redirect behavior
- If the path contains a wrong role segment, the app immediately redirects to the correct dashboard.
- This prevents the user from seeing the wrong navigation context.

### Deep links and notification actions
- Push notifications may resolve an action URL and push it via the router.
- If a deep link belongs to a different role, the authenticated layout still redirects safely.

## Key files referenced
- `FrontendMobile/app/_layout.tsx`
- `FrontendMobile/app/(auth)/_layout.tsx`
- `FrontendMobile/src/utils/roleValidation.ts`
- `FrontendMobile/src/utils/logoutUser.ts`
- `FrontendMobile/src/services/apiClient.ts`
- `FrontendMobile/src/features/core/components/OfflineBanner.tsx`

## Notes
- Role-based navigation is built on Expo Router conventions and route groups.
- The app treats role group mismatch as a signal to redirect rather than to render an error screen.
- Unauthorized API responses are handled globally, so navigation fallback remains consistent for all authenticated routes.
