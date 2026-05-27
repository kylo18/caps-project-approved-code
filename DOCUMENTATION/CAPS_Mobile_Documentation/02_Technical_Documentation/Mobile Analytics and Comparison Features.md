# Mobile Analytics and Comparison Features

## Purpose
This document explains the analytics, insights, leaderboard, and comparison-related features currently implemented in `FrontendMobile`. It focuses on actual mobile routes, services, and UI behavior.

## Mobile Scope
This document is written for the CAPS mobile app only and reflects the current `FrontendMobile` implementation. It does not describe web-only or backend-only behavior.

Last updated: May 27, 2026

This document has been reviewed and updated for the current CAPS mobile system.

---

## Overview

CAPS mobile separates analytics into student-facing insights and administrator-facing analytics/reporting.

Implemented analytics areas include:
- student insights and progress screens
- student leaderboard comparison
- class-level quiz history and leaderboard sections
- admin analytics overview
- admin reports and recent taker data
- unified admin enhancement workspace

The mobile frontend uses service wrappers under `src/services` and `src/features/*/services` to load analytics data through the shared `apiRequest(...)` client.

---

## Student Analytics

### Student insights route
Student profile and insight navigation is exposed through:

```text
app/(auth)/(student)/insights.tsx
```

Related hidden student analytics routes:
- `frequently-mistaken`
- `practice-history`
- `strong-areas`
- `weak-areas`
- `time-per-topic`

These screens let students review performance patterns after practice exams and class quizzes.

### Practice history
Route:

```text
app/(auth)/(student)/practice-history.tsx
```

The practice history screen supports:
- all attempts
- passed attempts
- failed attempts
- score summaries
- result review entry points

Passing is treated as a score of `75` or higher.

### Strong and weak areas
Routes:

```text
app/(auth)/(student)/strong-areas.tsx
app/(auth)/(student)/weak-areas.tsx
```

These screens summarize topics or subjects where the student performs well or needs improvement.

### Time per topic
Route:

```text
app/(auth)/(student)/time-per-topic.tsx
```

This screen supports study-time and topic-time review where data is available from the backend.

### Frequently mistaken
Route:

```text
app/(auth)/(student)/frequently-mistaken.tsx
```

This screen focuses on repeated mistakes so students can prioritize review.

---

## Student Comparison Features

### Leaderboard
Route:

```text
app/(auth)/(student)/leaderboard.tsx
```

Service:

```text
src/services/studentLeaderboardService.ts
```

Endpoint used:

```http
GET /api/leaderboard?period=<period>&program=<program>&subject=<subject>
```

The leaderboard supports comparison by:
- weekly ranking
- all-time ranking
- program filter
- subject filter

The UI uses student leaderboard components such as:
- `StudentLeaderboard.tsx`
- `StudentLeaderboardRow.tsx`
- `StudentLeaderboardPodium.tsx`
- `StudentFilterSheet.tsx`
- `LeaderboardShareModal.tsx`

### Class leaderboard
Class detail screens can show class-level leaderboard data for quiz activity.

Primary screen:

```text
src/features/classes/screens/ClassDetailScreen.tsx
```

This gives students and class managers a smaller comparison scope than the global leaderboard.

---

## Admin Analytics

### Main admin analytics service
Admin analytics API calls are implemented in:

```text
src/features/admin/insights/services/adminAnalyticsService.ts
```

The service exposes:
- `getDashboardSummary()`
- `getPassFailRate()`
- `getImprovementPercentage()`
- `getStudentProgressOverTime(period)`
- `getAverageScorePerSubject()`
- `getTopicMasteryLevel()`
- `getContentAnalytics()`
- `getAllAnalytics()`

`getAllAnalytics()` loads the main dashboard data in parallel.

### Admin analytics screens
Admin analytics is shown through:

```text
src/features/admin/insights/screens/AdminUnifiedEnhancementScreen.tsx
src/features/admin/insights/screens/AdminInsightsShellScreen.tsx
```

Routes include:
- `app/(auth)/(dean)/analytics.tsx`
- `app/(auth)/(associate-dean)/analytics.tsx`
- `app/(auth)/(dean)/enhancement.tsx`
- `app/(auth)/(associate-dean)/enhancement.tsx`

### Analytics data displayed
The admin analytics UI can display:
- active or total students
- total exams
- average score
- pass and fail rate
- improvement percentage
- score distribution
- average score per subject
- student progress over time
- topic mastery levels
- content engagement analytics

### Admin analytics endpoints
The mobile service calls:

```http
GET /api/admin/analytics/summary
GET /api/admin/analytics/pass-fail-rate
GET /api/admin/analytics/improvement-percentage
GET /api/admin/analytics/student-progress?period=week
GET /api/admin/analytics/student-progress?period=month
GET /api/admin/analytics/average-score-per-subject
GET /api/admin/analytics/topic-mastery
GET /api/admin/analytics/content
```

---

## Admin Reports and Comparison

Admin report service:

```text
src/features/admin/insights/services/adminReportsService.ts
```

Implemented report functions include:
- `getOverallRecentTakers()`
- `getOverallLeaderboard()`
- `getAllUserReports()`

Endpoints include:

```http
GET /api/practice-exam/overall-recent-takers
GET /api/practice-exam/overall-leaderboard
GET /api/support-tickets
```

These reports support comparison by:
- recent practice exam activity
- overall leaderboard standing
- user-submitted report or support-ticket activity

---

## Filtering in Analytics Views

Analytics comparison is supported through:
- leaderboard period, program, and subject filters
- admin enhancement student search
- admin enhancement program filter
- user-management filters for role, status, program, year, campus, and search
- subject and year filters in Program Chair subject management

Not every analytics screen has export or advanced date filtering in the current mobile frontend. Documentation should not claim export behavior unless a specific route implements it.

---

## Offline and Loading Behavior

Analytics and leaderboard requests go through `apiRequest(...)`, so they inherit:
- bearer token injection
- timeout handling
- `GET` cache storage
- cached fallback on server errors
- offline error handling when no cache exists

The API client gives analytics requests longer timeouts because these requests can be heavier than normal list screens.

---

## Maintenance Notes

- Keep endpoint documentation synchronized with `adminAnalyticsService.ts`, `adminReportsService.ts`, and `studentLeaderboardService.ts`.
- Do not document unsupported export features unless implemented in `FrontendMobile`.
- When adding new analytics cards, update both this file and the admin analytics dashboard guide.

---

*End of Document*
