# User Status Behavior

## Purpose
This document explains how user status is represented and used in the current CAPS mobile frontend. It is based on the `FrontendMobile` user-management screens and `src/utils/userManagement.ts`.

## Mobile Scope
This document is written for the CAPS mobile app only and reflects the current `FrontendMobile` implementation. It does not describe web-only or backend-only behavior.

Last updated: May 27, 2026

This document has been reviewed and updated for the current CAPS mobile system.

---

## Status Fields

Mobile user records commonly use:
- `status`
- `isActive`
- `roleID`
- `userID`

The utility file `src/utils/userManagement.ts` normalizes status values and helps screens decide labels, filters, and available actions.

---

## Main Status Values

### Pending
Backend/mobile value:

```text
pending
```

Meaning:
- user has registered but is not yet approved
- admin review is required

Mobile behavior:
- shown under the Pending filter
- can be approved by authorized admin screens
- included in bulk approve actions where implemented

### Registered and Active
Backend/mobile value:

```text
status = registered
isActive = true
```

Meaning:
- user is approved and active
- user can use role-allowed app features

Mobile behavior:
- shown as Active
- can be deactivated by authorized admin screens

### Registered and Inactive
Backend/mobile value:

```text
status = registered
isActive = false
```

Meaning:
- user is approved but disabled
- access may be restricted by backend login or authorization behavior

Mobile behavior:
- shown as Inactive
- can be activated by authorized admin screens

### Disapproved
Backend/mobile value:

```text
disapproved
```

Meaning:
- registration or account request was rejected

Mobile behavior:
- shown under the Disapproved filter
- Dean user management supports disapprove and re-approve actions where implemented

---

## Status Filters in Mobile

User-management screens use these visible status filters:
- All
- Pending
- Active
- Inactive
- Disapproved

Screens that implement these filters include:
- `app/(auth)/(dean)/users.tsx`
- `app/(auth)/(associate-dean)/users.tsx`
- `app/(auth)/(program-chair)/users.tsx`
- `app/(auth)/(faculty)/users.tsx`

When a status filter changes, screens request fresh data using query parameters such as:

```http
GET /api/users?status=registered
GET /api/users?status=pending
GET /api/users?status=disapproved
GET /api/users?state=inactive
```

After data is loaded, the app also applies local filters for role, status, program, year, campus, and search text.

---

## Role Filters

User screens group roles into:
- All
- Admins
- Students

Admin roles are role IDs:
- 2 Faculty
- 3 Program Chair
- 4 Dean
- 5 Associate Dean

Student role is:
- 1 Student

---

## Status Actions

### Approve
Endpoint pattern:

```http
PATCH /api/users/{userID}/approve
```

Local effect:

```text
status = registered
isActive = true
```

### Activate
Endpoint pattern:

```http
PATCH /api/users/{userID}/activate
```

Local effect:

```text
status = registered
isActive = true
```

### Deactivate
Endpoint pattern:

```http
PATCH /api/users/{userID}/deactivate
```

Local effect:

```text
status = registered
isActive = false
```

### Disapprove
Endpoint pattern:

```http
PATCH /api/users/{userID}/disapprove
```

Local effect:

```text
status = disapproved
isActive = false
```

### Re-approve
Endpoint pattern:

```http
PATCH /api/users/{userID}/reapprove
```

Local effect:

```text
status = pending
isActive = false
```

---

## Bulk Actions

Some admin screens support bulk actions against selected or filtered users:

```http
POST /api/users/approve-multiple
POST /api/users/activate-multiple
POST /api/users/deactivate-multiple
POST /api/users/disapprove-multiple
POST /api/users/reapprove-multiple
```

The payload uses:

```json
{
  "userIDs": [1, 2, 3]
}
```

Available bulk actions differ by role screen. Dean has the broadest mobile action set.

---

## Faculty User Screen Limitation

`app/(auth)/(faculty)/users.tsx` is documented in code as a view-only user list. Faculty can filter and inspect users, but the screen does not expose approval, deletion, or role-changing controls.

---

## Authentication Impact

The mobile login flow stores the authenticated user and token after a successful `POST /api/login`. Actual login eligibility for inactive, pending, or disapproved users depends on backend authentication responses.

Mobile behavior after authentication:
- stores token and user in SecureStore
- sets Redux credentials
- routes by `roleID`
- redirects invalid or unknown roles to `/`

When an API request returns `401 Unauthorized`, `apiRequest(...)` clears authentication through the logout flow and sends the user back to login.

---

## Display Behavior

User list rows show:
- avatar or initials
- name
- email or user code where available
- role badge
- status badge
- action buttons when allowed

Status badge colors are assigned in each screen using role theme colors:
- active uses green
- inactive uses red
- pending uses blue
- disapproved uses orange-style warning color

---

## Maintenance Notes

- Use `src/utils/userManagement.ts` as the source of truth for local status interpretation.
- Keep backend status strings and mobile status filters synchronized.
- Add new status values to this document only after the mobile screens actually handle them.

---

*End of Document*
