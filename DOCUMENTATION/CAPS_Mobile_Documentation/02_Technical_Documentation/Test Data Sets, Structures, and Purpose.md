# Test Data Sets, Structures, and Purpose

## Purpose
This document describes practical test data needed to validate the current `FrontendMobile` application. It focuses on the mobile frontend screens, roles, statuses, services, and user flows that exist in the Expo app.

## Mobile Scope
This document is written for the CAPS mobile app only and reflects the current `FrontendMobile` implementation. It does not describe web-only or backend-only behavior.

Last updated: May 27, 2026

This document has been reviewed and updated for the current CAPS mobile system.

---

## Overview

The CAPS mobile frontend depends on backend API data. Good test data should cover:
- all role dashboards
- authentication states
- user status states
- subjects and questions
- practice exams
- class quizzes
- analytics results
- notifications
- support tickets
- offline and cached data behavior

The mobile app does not use local JSON fixtures as its main data source. Most test data should be prepared in the backend database or API environment that `EXPO_PUBLIC_API_URL` points to.

---

## Required Role Accounts

Create at least one active account for each role:

| Role ID | Role | Needed for |
|---:|---|---|
| 1 | Student | student dashboard, practice exams, classes, leaderboard, help center |
| 2 | Faculty | faculty dashboard, classes, subjects, users read-only flow |
| 3 | Program Chair | scoped users, subject management, question approval |
| 4 | Dean | admin dashboard, users, analytics, support, reports |
| 5 | Associate Dean | admin dashboard, users, analytics, enhancement |

Also prepare accounts with these status combinations:
- pending
- registered and active
- registered and inactive
- disapproved

These states are needed to verify login access, user-management badges, filters, and admin actions.

---

## Authentication Test Data

Prepare:
- valid user code and password
- invalid password
- inactive registered user
- pending user
- disapproved user
- account that supports remember-me testing
- account that can test biometric login after remember-me is enabled
- OAuth callback test account if Google or Facebook login is enabled in the environment

Expected mobile flows:
- `POST /api/login`
- `GET /api/user/profile`
- SecureStore token and user persistence
- route selection by role
- logout on `401 Unauthorized`

---

## User Management Test Data

Create users with varied:
- role IDs
- programs
- year levels
- campuses
- statuses
- `isActive` values
- names, emails, and user codes for search testing

Needed screens:
- `app/(auth)/(dean)/users.tsx`
- `app/(auth)/(associate-dean)/users.tsx`
- `app/(auth)/(program-chair)/users.tsx`
- `app/(auth)/(faculty)/users.tsx`

Needed actions:
- approve
- activate
- deactivate
- disapprove
- re-approve where supported
- bulk approve
- bulk activate/deactivate/disapprove where supported by the role screen

---

## Subject and Question Test Data

Prepare subjects with:
- subject code
- subject name
- program assignment
- year-level assignment
- general education or non-program subject cases
- enough records for paging or scrolling

Prepare questions with:
- pending status
- approved status
- exam purpose
- practice purpose
- topics
- rich text content
- choices and correct answers

Needed screens:
- student subject search
- faculty subjects
- program chair subjects
- dean subjects
- practice-exam add, edit, duplicate, and result screens

Needed endpoints include:
- `GET /api/subjects`
- `GET /api/student/practice-subjects`
- `GET /api/subjects/{subjectID}/questions`
- question status and delete endpoints used by role subject screens

---

## Practice Exam Test Data

Prepare:
- subjects with enough questions to generate an exam
- practice questions with correct answers
- previous exam results
- results with passed scores
- results with failed scores
- bookmarked questions
- frequently missed questions
- topic performance records

Needed routes:
- `app/(auth)/(student)/search.tsx`
- `app/(auth)/practice-exam/take.tsx`
- `app/(auth)/practice-exam/results.tsx`
- `app/(auth)/(student)/practice-history.tsx`
- `app/(auth)/(student)/bookmarks.tsx`
- `app/(auth)/(student)/frequently-mistaken.tsx`
- `app/(auth)/(student)/strong-areas.tsx`
- `app/(auth)/(student)/weak-areas.tsx`
- `app/(auth)/(student)/time-per-topic.tsx`

---

## Class and Quiz Test Data

Prepare:
- active classes
- archived classes
- class codes for joining
- classes with and without students
- classes with quizzes
- quizzes not yet started
- quizzes in progress
- submitted quiz results
- quiz history records
- class leaderboard records

Needed service endpoints from `studentClassService.ts` include:
- `GET /api/my-classes`
- `POST /api/classes/join`
- `POST /api/classes/{classID}/unenroll`
- `GET /api/classes/{classID}/quizzes/student`
- `GET /api/quizzes/{classPersonalQuizID}/info`
- `POST /api/quizzes/{classPersonalQuizID}/start`
- `POST /api/quizzes/{classPersonalQuizID}/submit`
- `GET /api/quiz-results`
- `GET /api/quiz-results/{resultID}`
- `GET /api/classes/{classID}/quiz-history`

---

## Leaderboard and Analytics Test Data

Prepare:
- students across multiple programs
- subjects with results
- weekly results
- all-time results
- enough scores to create rankings
- tied or close scores for ranking display

Needed for:
- student leaderboard period filter
- program filter
- subject filter
- leaderboard podium and rows
- admin overall leaderboard

Prepare admin analytics data for:
- active students
- total exams
- average score
- pass and fail rates
- score distribution
- improvement percentage
- progress over time
- average score per subject
- topic mastery
- content analytics

Needed endpoints include:
- `/api/leaderboard`
- `/api/admin/analytics/summary`
- `/api/admin/analytics/pass-fail-rate`
- `/api/admin/analytics/improvement-percentage`
- `/api/admin/analytics/student-progress`
- `/api/admin/analytics/average-score-per-subject`
- `/api/admin/analytics/topic-mastery`
- `/api/admin/analytics/content`

---

## Support and Help Test Data

Prepare FAQ records with:
- active state
- category
- question
- answer
- display order if supported

Prepare support tickets with:
- open status
- in-progress status
- resolved status
- closed status
- different categories
- student identity fields
- recent and older dates

Needed screens and services:
- `HelpCenterModal.tsx`
- `helpService.ts`
- `adminSupportService.ts`
- dean support route

Needed endpoints:
- `GET /api/support/faqs`
- `GET /api/support/categories`
- `POST /api/support-tickets`
- `GET /api/support-tickets/me`
- `GET /api/admin/support/tickets`
- `GET /api/admin/support/tickets/{id}`
- `PATCH /api/admin/support/tickets/{id}`

---

## Notification Test Data

Prepare notifications with:
- unread and read states
- action URLs
- different notification types
- announcement-like content
- class or quiz-related content

Needed service functions:
- `getNotifications()`
- `markNotificationRead(notificationID)`
- `markAllNotificationsRead()`
- `deleteNotification(notificationID)`
- `getUnreadCount()`

Also test push token registration outside Expo Go when supported.

---

## Offline and Cache Test Data

To test offline behavior:
1. Log in while online.
2. Load dashboards, lists, analytics, and leaderboard data to seed `GET` caches.
3. Disable network connectivity.
4. Reopen the same screens and confirm cached `GET` data is shown where available.
5. Perform a mutation while offline and confirm the app queues it.
6. Reconnect and confirm the offline queue sync attempt runs.

Important files:
- `src/services/apiClient.ts`
- `src/services/cacheService.ts`
- `src/features/core/components/OfflineBanner.tsx`

---

## Maintenance Notes

- Keep test data anonymous and non-sensitive.
- Use separate test accounts for each role and status.
- Keep at least one small dataset and one larger dataset for list and filter testing.
- Update this document when a new mobile screen, role action, or service endpoint is added.

---

*End of Document*
