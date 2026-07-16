# User Case Documentation

## Purpose
This document summarizes the main user flows implemented in the CAPS mobile frontend under `FrontendMobile`. It is written as a functional reference for testing, validation, and stakeholder review.

## Mobile Scope
This document is written for the CAPS mobile app only and reflects the current `FrontendMobile` implementation. It does not describe web-only or backend-only behavior.

Last updated: May 27, 2026

This document has been reviewed and updated for the current CAPS mobile system.

---

## Role Summary

| Role ID | Role | Main mobile area |
|---:|---|---|
| 1 | Student | dashboard, classes, practice, leaderboard, insights |
| 2 | Faculty | dashboard, subjects, classes, users, profile |
| 3 | Program Chair | users, subjects, classes, reports, insights |
| 4 | Dean | users, subjects, classes, analytics, reports, support |
| 5 | Associate Dean | users, subjects, classes, analytics, enhancement |

---

## Login Flow

### Primary path
1. User opens the app at `app/index.tsx`.
2. User enters user code and password.
3. App sends `POST /api/login`.
4. App stores token and user data in SecureStore.
5. App stores Redux credentials through `authSlice`.
6. App routes the user to the dashboard for their role.

### Remember-me path
1. User enables remember-me during login.
2. App stores `rememberMe=true` in SecureStore.
3. On next launch, app reads stored token and user.
4. App validates the session through `GET /api/user/profile`.
5. If valid, app restores Redux auth state and routes by role.

### Biometric path
1. User logs in successfully with remember-me enabled.
2. If biometric preference is unset, the app prompts the user.
3. If enabled, future launches require successful biometric authentication before restoring the session.

### Failure paths
- Invalid credentials show an error.
- Expired or invalid tokens trigger logout and return to `/`.
- Unknown roles route back to `/`.

---

## Registration Flow

Route:

```text
app/register.tsx
```

Flow:
1. User opens registration.
2. User enters required account details.
3. App validates the form locally.
4. App submits `POST /api/register`.
5. On success, user returns to login.
6. New accounts may require approval depending on backend status rules.

---

## Password Reset Flow

Routes:

```text
app/forgot-password.tsx
app/reset-password.tsx
```

Flow:
1. User opens forgot password.
2. App submits a reset request through `POST /api/forgot-password`.
3. User follows the reset process.
4. Reset completion is handled by the reset-password route.

---

## Student Use Cases

### View dashboard
1. Student logs in.
2. App routes to `/(auth)/(student)/dashboard`.
3. Student sees dashboard content, shortcuts, and progress-related entry points.

### Search and take a practice exam
1. Student opens Search.
2. App loads practice subjects from `GET /api/student/practice-subjects`.
3. Student searches or filters subjects.
4. Student selects a subject.
5. App generates a practice exam.
6. Student answers questions in the practice exam route.
7. Student submits and views results.

### Review practice history
1. Student opens Practice History.
2. App loads previous results.
3. Student filters by all, passed, or failed.
4. Student opens a result for review when available.

### Join and take class quizzes
1. Student opens Classes.
2. App loads `GET /api/my-classes`.
3. Student joins a class with a class code through `POST /api/classes/join`.
4. Student opens class detail.
5. App loads available quizzes.
6. Student starts a quiz.
7. Student submits answers and views result.

### Use leaderboard
1. Student opens Leaderboard.
2. App loads ranking data from `/api/leaderboard`.
3. Student switches weekly or all-time period.
4. Student filters by program or subject.
5. Student views podium and ranking rows.

### Use Help Center
1. Student opens Help Center.
2. Student views FAQs.
3. Student opens Support tab.
4. Student selects category, enters subject and message.
5. App submits a support ticket.

---

## Faculty Use Cases

### View assigned work areas
1. Faculty logs in.
2. App routes to faculty dashboard.
3. Faculty uses bottom tabs for dashboard, subjects, classes, and profile.

### Review classes
1. Faculty opens Classes.
2. Faculty searches classes by class name, class code, subject code, subject name, or schedule.
3. Faculty opens class detail to inspect related quiz and class information.

### Review users
1. Faculty opens Users from a hidden route or shortcut.
2. App loads user data.
3. Faculty filters by role, status, program, year, campus, or search text.
4. Faculty views users without approval or destructive admin controls.

---

## Program Chair Use Cases

### Manage scoped users
1. Program Chair opens Users.
2. App loads users through `/api/users`.
3. Program Chair filters users by role, status, program, year, campus, and search.
4. Program Chair performs available status actions according to backend permissions.

### Manage subjects and questions
1. Program Chair opens Subjects.
2. App loads subjects with program and year filters.
3. Program Chair opens a subject's questions.
4. Program Chair reviews pending, practice, and exam question tabs.
5. Program Chair approves or deletes questions where allowed.

---

## Dean and Associate Dean Use Cases

### Manage users
1. Dean or Associate Dean opens Users.
2. App loads paginated users from `/api/users`.
3. User filters can include role, status, program, year, campus, and search.
4. Admin approves, activates, deactivates, or bulk-updates users where supported.
5. Dean supports disapprove and re-approve actions where implemented.

### View analytics
1. Admin opens Analytics or Enhancement.
2. App loads analytics through `getAllAnalytics()`.
3. App displays summary, pass/fail, progress, subject, topic mastery, and content analytics data.

### Review support tickets
1. Dean opens Support.
2. App loads support tickets from `GET /api/admin/support/tickets`.
3. Admin opens a ticket detail.
4. If the ticket is pending, the app may move it to in review.
5. Admin updates ticket status to the next state.

### Create announcements
1. Admin or faculty role opens Create Announcement.
2. App submits announcement data through `/api/admin/notifications`.
3. Notifications can be delivered to target users based on backend handling.

---

## Notification Use Case

1. App registers for push notifications when supported.
2. App sends the push token to the backend when authenticated.
3. User receives a notification.
4. If the user taps it, the app resolves the action URL and navigates to the matching route.
5. User can view notifications, mark them read, mark all read, or delete them through notification UI where available.

---

## Offline Use Case

1. User loads data while online.
2. App caches successful `GET` responses.
3. User loses connection.
4. `OfflineBanner` appears.
5. Previously cached `GET` data may still appear.
6. Non-GET changes are queued.
7. When connection returns, app attempts to sync queued changes.

---

## Profile Use Case

1. User opens Profile from their role tab.
2. App displays role-aware profile information.
3. User opens edit profile when available.
4. App validates and submits profile changes through the relevant service or endpoint.
5. Redux user state can be updated through `updateUser`.

---

## Maintenance Notes

- Use this document for mobile frontend flows only.
- Keep role flows synchronized with the route groups under `app/(auth)`.
- When a flow is added or removed, update the matching service and route references here.

---

*End of Document*
