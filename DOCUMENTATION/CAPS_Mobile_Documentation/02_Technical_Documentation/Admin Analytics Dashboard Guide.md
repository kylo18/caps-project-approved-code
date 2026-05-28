# Admin Analytics Dashboard Guide

## Purpose
This document explains how the admin analytics dashboard works in the CAPS mobile application based on the current `FrontendMobile` implementation. It serves as an administrator user guide and also documents the mobile screen flow, service layer, and API usage behind the dashboard.

## Mobile Scope
This document is written for the CAPS mobile app only and reflects the current `FrontendMobile` implementation. It does not describe web-only or backend-only behavior.

Last updated: May 27, 2026

This document has been reviewed and updated for the current CAPS mobile system.

---

## Intended Users
- Dean
- Associate Dean
- Program Chair
- Faculty

Note: The mobile administrator analytics workspace is mainly presented through the dean and associate dean analytics screens. The backend also supports role-based analytics access for program chairs and faculty members, but the data scope changes based on the logged-in role.

Frontend files referenced by this guide:
- `src/features/admin/insights/screens/AdminUnifiedEnhancementScreen.tsx`
- `src/features/admin/insights/screens/AdminInsightsShellScreen.tsx`
- `src/features/admin/insights/services/adminAnalyticsService.ts`
- `app/(auth)/(dean)/analytics.tsx`
- `app/(auth)/(associate-dean)/analytics.tsx`

---

## Table of Contents
1. [Overview](#overview)
2. [Administrator User Guide](#administrator-user-guide)
3. [Dashboard Sections](#dashboard-sections)
4. [System Flow](#system-flow)
5. [API Usage](#api-usage)
6. [Role-Based Access and Data Scope](#role-based-access-and-data-scope)
7. [Error Handling and Offline Behavior](#error-handling-and-offline-behavior)
8. [Notes](#notes)

---

## Overview
The admin analytics dashboard helps administrators review student performance, subject performance, pass and fail trends, learning difficulty, and content engagement. In the mobile app, the analytics view is part of the admin insights workspace and is loaded from backend analytics endpoints.

The dashboard is designed to help administrators:
- Monitor overall student performance
- Review top-performing subjects
- Identify weak or difficult topics
- Track recent progress over time
- Review lesson views, question attempts, and skipped topics
- Use analytics data for reports, interventions, and academic decisions

---

## Administrator User Guide

### How to open the analytics dashboard
1. Log in to the CAPS mobile application using an authorized administrator account.
2. Open the `Insights` area.
3. Select `Analytics Overview` or open the merged admin enhancement workspace.
4. Tap the `Analytics` tab if the merged screen opens on a different tab first.

### What administrators can do
- View summary metrics such as total students, average score, pass rate, and improvement
- Review subject-level average scores
- See recent student progress by time period
- Check pass and fail breakdowns
- Identify topics that students find difficult
- Review content activity such as lesson views, quiz attempts, and skipped topics

### How to refresh dashboard data
1. Open the analytics screen.
2. Pull down to refresh.
3. Wait for the dashboard to reload the latest data from the server.

### How to use the information
- Use `Average Score` to monitor general student performance
- Use `Pass Rate` to see how many exam results meet the passing score
- Use `Improvement` to compare recent performance against the previous month
- Use `Top Subjects` to find strong subject areas
- Use `Weakest Topics` to identify topics that may need support
- Use `Content Summary` to understand how students interact with lessons and questions
- Use `Recent Progress` to check whether results are improving over time

---

## Dashboard Sections

### 1. Summary Metrics
This section shows high-level values for:
- Total students
- Average score
- Pass rate
- Improvement percentage

These values are loaded from the analytics summary endpoint and shown as quick metric cards.

### 2. Content Summary
This section shows engagement data, including:
- Most viewed lessons
- Most attempted quiz questions
- Most skipped topics

This helps administrators see what content students interact with most and where learning gaps may appear.

### 3. Top Subjects
This section shows subjects ranked by average score. It helps administrators find which subjects have stronger overall results.

### 4. Weakest Topics
This section shows topic difficulty based on learning difficulty analytics. Each topic is marked as:
- `easy`
- `moderate`
- `difficult`

This helps identify areas where students may need intervention, content review, or instructional support.

### 5. Recent Progress
This section shows average score trends over time. It also displays:
- Number of exams
- Number of students
- Average score for each period

This helps administrators review whether results are improving, declining, or staying stable.

---

## System Flow

### High-Level Flow
1. The administrator opens the analytics dashboard in the mobile app.
2. The mobile screen calls the admin analytics service.
3. The service sends authenticated requests to the backend API.
4. The backend checks the user role and applies role-based data scope.
5. The backend collects data from analytics-related tables and exam result tables.
6. The backend returns structured JSON responses.
7. The mobile app maps the response data into dashboard cards, lists, and trend sections.

### Mobile Frontend Flow
The mobile admin analytics screen uses the admin analytics service to load all required dashboard data in parallel. The screen also separately loads student records for the student count and student list area.

Frontend flow:
1. `AdminUnifiedEnhancementScreen` opens.
2. The screen calls `getAllAnalytics()`.
3. `getAllAnalytics()` runs multiple analytics requests using `Promise.all(...)`.
4. The returned data is stored in state variables such as:
   - `summary`
   - `passFail`
   - `improvement`
   - `subjects`
   - `progress`
   - `topicMastery`
   - `content`
5. The screen renders the analytics tab using those values.

### Backend Flow
Each analytics endpoint is handled by `AdminAnalyticsController`.

Backend flow:
1. The API receives the request.
2. The authenticated user is read using `Auth::user()`.
3. The controller checks the role and filters the query using `applyRoleBasedScope(...)`.
4. The controller queries the needed tables.
5. The controller formats the result into JSON.
6. The mobile app receives and displays the result.

### Data Sources Used by the Backend
The admin analytics controller reads from several tables, including:
- `practice_exam_results`
- `practice_exam_answers`
- `content_analytics`
- `learning_difficulty_analytics`
- `questions`
- `subjects`
- `users`
- `programs`
- `user_feedback`
- `support_tickets`

---

## API Usage

### Authentication Requirement
All admin analytics endpoints require:
- `auth:sanctum`
- valid bearer token
- allowed role based on route middleware

General analytics access is allowed for:
- Faculty (`roleID: 2`)
- Program Chair (`roleID: 3`)
- Dean (`roleID: 4`)
- Associate Dean (`roleID: 5`)

### Base Behavior in Mobile
The mobile app sends requests through `apiRequest(...)`, which:
- adds the bearer token automatically
- sends `Accept: application/json`
- sends `Content-Type: application/json`
- caches successful `GET` responses
- falls back to cached data when the server is unreachable
- clears local authentication data on `401 Unauthorized`
- uses a longer timeout for analytics and insights requests than ordinary requests

### Main Analytics Endpoints

#### `GET /api/admin/analytics/summary`
Purpose: Get dashboard summary metrics.

Main response fields:
- `active_students`
- `total_students`
- `total_exams`
- `average_score`
- `pass_rate`
- `improvement_percentage`
- `fail_rate`

Used for:
- summary cards
- high-level admin overview

#### `GET /api/admin/analytics/pass-fail-rate`
Purpose: Get pass and fail counts and score distribution.

Main response fields:
- `total`
- `passed`
- `failed`
- `pass_rate`
- `breakdown.excellent`
- `breakdown.good`
- `breakdown.needs_improvement`
- `breakdown.poor`

Used for:
- pass and fail indicators
- performance grouping

#### `GET /api/admin/analytics/improvement-percentage`
Purpose: Compare current month average score with previous month average score.

Main response fields:
- `current_month_avg`
- `previous_month_avg`
- `improvement_percentage`
- `trend`

Used for:
- improvement card
- trend monitoring

#### `GET /api/admin/analytics/student-progress?period=week`
#### `GET /api/admin/analytics/student-progress?period=month`
Purpose: Return progress trends over time.

Main response fields:
- `period`
- `avg_score`
- `student_count`
- `exam_count`

Used for:
- recent progress section
- trend review

#### `GET /api/admin/analytics/average-score-per-subject`
Purpose: Return average score and exam count per subject.

Main response fields:
- `subjectID`
- `subjectName`
- `avg_score`
- `exam_count`

Used for:
- top subjects section

#### `GET /api/admin/analytics/topic-mastery`
Purpose: Return topic difficulty and mastery indicators.

Main response fields:
- `subjectName`
- `topic`
- `avg_difficulty`
- `total_attempts`
- `avg_attempts`
- `mastery_level`

Used for:
- weakest topics section

#### `GET /api/admin/analytics/content`
Purpose: Return content engagement analytics.

Main response fields:
- `most_viewed_lessons`
- `most_attempted_quiz_questions`
- `most_skipped_topics`
- `highest_error_questions`

Used for:
- content summary section

### Role-Specific Analytics Endpoints

#### `GET /api/admin/analytics/all`
Purpose: Return campus-wide analytics for dean and associate dean users.

Includes:
- student totals
- programs
- feedback summaries
- support ticket summaries

#### `GET /api/admin/analytics/program/{programId}`
Purpose: Return program-level analytics for a program chair.

Includes:
- program details
- student count by year level
- feedback summary
- academic performance summary

#### `GET /api/admin/analytics/faculty/{facultyId}`
Purpose: Return faculty-level analytics for a faculty member.

Includes:
- faculty details
- assigned subjects
- student lists
- subject performance
- feedback summary

### Example Request
```http
GET /api/admin/analytics/summary
Authorization: Bearer <token>
Accept: application/json
Content-Type: application/json
```

### Example Response
```json
{
  "message": "Analytics summary retrieved successfully",
  "data": {
    "active_students": 120,
    "total_students": 180,
    "total_exams": 540,
    "average_score": 76.42,
    "pass_rate": 0.81,
    "improvement_percentage": 4.25,
    "fail_rate": 0.19
  }
}
```

Note: In the summary endpoint, `pass_rate` and `fail_rate` are returned as decimal ratios from `0` to `1`. In the pass-fail endpoint, `pass_rate` is returned as a percentage from `0` to `100`.

---

## Role-Based Access and Data Scope

### How data scope works
The backend uses `applyRoleBasedScope(...)` to prevent users from viewing data outside their allowed scope.

### Scope by role
- Dean: can view all active student data within the same campus
- Associate Dean: can view all active student data within the same campus
- Program Chair: can view active student data within the same campus and assigned program
- Faculty: can view active student data within the same campus and assigned program

### Why this matters
This protects analytics privacy and helps ensure that users only see the data they are allowed to manage.

---

## Error Handling and Offline Behavior

### When the request fails
If an analytics request fails:
- the mobile app logs the error
- the screen may show a toast message
- empty values or fallback values may be used

### When the user is offline
For `GET` requests:
- the app checks cached data first
- if cached data exists, it can still show saved results
- if no cached data exists, the request fails with an offline message

### When the token is expired or invalid
If the server returns `401 Unauthorized`:
- stored token and user data are cleared
- the app triggers the unauthorized handler
- the user must log in again

---

## Notes
- The analytics dashboard in mobile is connected to the admin enhancement workspace.
- The dashboard loads multiple analytics endpoints in parallel for faster display.
- Student list data is fetched separately from the analytics summary data.
- Some endpoints return percentages as decimals while others return them as full percentages, so frontend formatting must match the endpoint behavior.
- The dashboard is most useful when practice exam data, content interaction data, and difficulty analytics data are already populated in the database.
- Keep this guide synchronized with `FrontendMobile/src/features/admin/insights/services/adminAnalyticsService.ts` when endpoint names, returned fields, or fallback values change.

---

*End of Document*
