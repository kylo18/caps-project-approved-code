# API Documentation

## Purpose
This document describes the current CAPS mobile app API behavior and endpoint usage. It focuses on the mobile `FrontendMobile` implementation and explains how the app communicates with backend services.

## Mobile Scope
This document is written for the CAPS mobile application only. It reflects the current `FrontendMobile` API client and service usage. It does not describe web-only or backend-only behavior.

Last updated: May 27, 2026

---

## API Layer Overview
All mobile API requests are sent through the shared client in:

- `FrontendMobile/src/services/apiClient.ts`

The mobile app uses `apiRequest(...)` for nearly all backend calls. This wrapper handles:

- base URL from `EXPO_PUBLIC_API_URL`
- JSON request headers
- bearer token injection from Expo SecureStore
- request timeout handling
- `401 Unauthorized` logout handling
- GET response caching
- cached fallback when the server is unreachable
- offline queueing for non-GET mutations
- offline queue sync after reconnection

### Core API Client file
The main client is implemented in:

- `FrontendMobile/src/services/apiClient.ts`

Key functions:

- `rawApiRequest(path, options)` — sends the raw `fetch` request
- `apiRequest(path, options)` — public wrapper with online/offline, cache, and queue behavior
- `syncOfflineQueue()` — retries queued offline writes when the connection returns
- `registerUnauthorizedCallback(callback)` — registers a logout callback for `401` events

---

## Authentication and Headers

### Authentication
Most requests require an authentication token. The mobile app stores the token in Expo SecureStore under the key `token`.

When `auth` is enabled in `apiRequest(...)`, the client adds:

```http
Authorization: Bearer <token>
```

### Request headers
Every request includes:

```http
Content-Type: application/json
Accept: application/json
```

For authenticated requests, `Authorization` is also included.

---

## Timeouts
Timeouts are adjusted by endpoint type:

- `/leaderboard` requests: 60 seconds
- `/analytics` or `/insights` requests: 45 seconds
- `/admin/notifications` requests: 120 seconds
- default requests: 30 seconds

These rules are defined in `getTimeout(path)` inside `apiClient.ts`.

---

## Caching and Offline Behavior

### GET caching
- Successful `GET` responses are cached in local storage.
- Cached responses are kept for 5 minutes.
- If a `GET` fails due to server or network issues, the app falls back to cached data if available.

### Offline write queue
- Non-GET requests made while offline are queued.
- Queued actions are retried automatically when the app regains connection.
- The app informs the user that the action was queued and will sync later.

### Offline read fallback
- When offline, `GET` requests first return cached data if available.
- If no cache is available, the request fails with a user-friendly offline message.

---

## Error Handling

### Unauthorized access
- `401 Unauthorized` responses trigger the logout flow.
- The app clears auth state and redirects the user to login.

### Network and timeout errors
- If a request times out or network failure occurs, the app throws a timeout error.
- On `GET` failures, the client may return cached data when available.

---

## Common API Endpoints
This section lists key mobile endpoints grouped by feature area. The list is based on current `FrontendMobile` service usage.

### Authentication
- `POST /api/login`
- `GET /api/user/profile`
- `POST /api/register`
- `POST /api/forgot-password`
- `POST /api/reset-password`

### Student and Practice
- `GET /api/student/practice-subjects`
- `GET /api/practice-exam/history`
- `GET /api/practice-exam/content-analytics`
- `GET /api/practice-exam/difficulty-analytics`
- `GET /api/leaderboard?period=<period>&program=<program>&subject=<subject>`
- `GET /api/analytics/recommendations/{attemptId}`
- `GET /api/analytics/weak-topics/{userId}`
- `GET /api/analytics/rank/{examId}/{userId}`
- `GET /api/analytics/progress/{userId}/{subjectId}`
- `GET /api/analytics/subject-score/{userId}/{subjectId}`
- `GET /api/analytics/student-summary/{userId}/{attemptId}`

### Classes and Faculty
- `GET /api/my-classes`
- `POST /api/classes/join`
- `GET /api/classes/index`
- `GET /api/classes/{classID}/students`
- `GET /api/classes/{classID}/quizzes`
- `GET /api/classes/quizzes/available`
- `POST /api/classes/quizzes/{classPersonalQuizID}`
- `GET /api/subjects`
- `POST /api/classes/{classID}/archive`
- `POST /api/classes/{classID}/unarchive`
- `GET /api/classes/archived`
- `GET /api/classes/{classID}/quiz-results`
- `GET /api/quizzes/{quizID}/results`
- `GET /api/quizzes/{quizID}/non-takers`
- `GET /api/personal-quizzes/{quizID}/classes`
- `POST /api/personal-quizzes/{quizID}/assign-classes`
- `GET /api/personal-quiz/{quizID}/leaderboard`
- `GET /api/personal-quiz/{quizID}/recent-takers`

### User Management and Support
- `GET /api/support/faqs`
- `GET /api/support/categories`
- `POST /api/support-tickets`
- `POST /api/admin/notifications`
- `GET /api/feedback`
- `POST /api/feedback`
- `GET /api/admin/support/tickets`
- `GET /api/admin/support/tickets/{id}`
- `PATCH /api/admin/support/tickets/{id}`

### Notifications
- `GET /api/notifications`
- `POST /api/notifications/mark-all-read`
- `POST /api/notifications/{notificationID}/read`
- `DELETE /api/notifications/{notificationID}`
- `GET /api/notifications/unread-count`
- `POST /api/push-token`

### Analytics and Reports
- `GET /api/admin/analytics/summary`
- `GET /api/admin/analytics/pass-fail-rate`
- `GET /api/admin/analytics/improvement-percentage`
- `GET /api/admin/analytics/student-progress?period=week`
- `GET /api/admin/analytics/student-progress?period=month`
- `GET /api/admin/analytics/average-score-per-subject`
- `GET /api/admin/analytics/topic-mastery`
- `GET /api/admin/analytics/content`
- `GET /api/practice-exam/overall-recent-takers`
- `GET /api/practice-exam/overall-leaderboard`
- `GET /api/support-tickets`

---

## Feature Service Mapping
The mobile app organizes API usage through service modules. Example service files include:

- `src/services/apiClient.ts`
- `src/services/helpService.ts`
- `src/services/notificationService.ts`
- `src/services/studentClassService.ts`
- `src/services/facultyClassService.ts`
- `src/features/admin/insights/services/adminAnalyticsService.ts`
- `src/features/admin/insights/services/adminReportsService.ts`
- `src/features/student/insights/services/studentAnalyticsService.ts`

Each service imports `apiRequest(...)` and documents the endpoints it uses.

---

## Notes
- This API documentation is designed for the current CAPS mobile frontend.
- If the mobile client adds or changes endpoints, update this document to match the new service behavior.
- This file does not cover backend-only endpoints that are not consumed by the mobile app.
