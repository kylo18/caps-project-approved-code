# Help Center and Support Documentation

## Purpose
This document explains the currently implemented Help Center and Support features in the CAPS mobile application. It covers the student-facing FAQ and support request flow, the role-based behavior of the shared help modal, and the administrator support ticket management workflow backed by the mobile app and backend API.

---

## Intended Users
- Student
- Faculty
- Program Chair
- Dean
- Associate Dean

Note: The implemented behavior is different by role. Students use the Help Center for FAQs and support requests. Non-student roles can open the shared modal, but it currently functions as an announcement creation entry point instead of a ticket submission form. Ticket review and status handling are done through the admin support screen.

---

## Table of Contents
1. [Overview](#overview)
2. [Student Help Center Guide](#student-help-center-guide)
3. [Student Support Request Flow](#student-support-request-flow)
4. [Administrator Support Ticket Guide](#administrator-support-ticket-guide)
5. [System Flow](#system-flow)
6. [API Usage](#api-usage)
7. [Role-Based Access and Scope](#role-based-access-and-scope)
8. [Validation, Error Handling, and Current Limitations](#validation-error-handling-and-current-limitations)
9. [Notes](#notes)

---

## Overview
The CAPS mobile support features are split into two main parts:
- a Help Center experience for students that provides FAQs and a support request form
- a support ticket management screen for authorized academic staff and administrators

The current mobile implementation supports:
- loading FAQs from backend support endpoints
- using fallback FAQ data if the API is unavailable
- submitting student support tickets
- viewing support tickets in an admin queue
- opening ticket details
- updating ticket status from `pending` to `in_review` to `resolved`
- automatic status change from `pending` to `in_review` when an admin opens a ticket detail view

The current mobile implementation does not confirm:
- student-side ticket conversation threads in the mobile UI
- working admin reply submission to a ticket
- ticket deletion from the mobile admin screen through a visible UI action

---

## Student Help Center Guide

### How students open Help Center
1. Log in to the CAPS mobile application using a student account.
2. Open the Help Center entry point from the dashboard, header, or profile action where available.
3. The shared `Help Center` modal opens.
4. The modal starts on the `FAQs` tab for student users.

### What students can do
- View frequently asked questions
- Expand or collapse FAQ items
- Switch from the `FAQs` tab to the `Support` tab
- Enter a category, subject, and detailed message for a support request
- Submit the request to the backend support ticket endpoint

### FAQ behavior
The student Help Center loads FAQ content through the help service. If the API returns active FAQ records, those entries are shown. If the API is unavailable or does not return usable data, the mobile app falls back to built-in FAQ entries.

Examples of supported FAQ topics in the current mobile implementation include:
- practice exams
- score calculation
- leaderboard meaning
- password and account help
- how to contact support

---

## Student Support Request Flow

### How students submit a support request
1. Open the Help Center.
2. Switch to the `Support` tab.
3. Select a category:
   - `General`
   - `Technical`
   - `Account`
   - `Academic`
   - `Other`
4. Enter a subject.
5. Enter a message describing the issue.
6. Tap `Submit Request`.
7. The app sends the request to the backend.

### Input rules
- `subject` is required
- `message` is required
- `message` must be at least 10 characters

### Backend ticket creation behavior
When a student submits the form, the mobile app posts to `POST /api/support-tickets` with:
- `subject`
- `message`
- `issue_type`

The backend normalizes that payload into a support ticket record and maps the issue type into a ticket category such as:
- `technical`
- `account`
- `academic`
- `other`

New tickets are created with:
- status: `open`
- priority: `medium`

Students can also retrieve their own submitted tickets through `GET /api/support-tickets/me`, although the current document set does not show a dedicated mobile screen for browsing a personal ticket history.

---

## Administrator Support Ticket Guide

### Who can access the ticket management screen
The backend support ticket administration endpoints are available to authenticated academic staff roles:
- Faculty
- Program Chair
- Dean
- Associate Dean

The mobile admin support screen is implemented as a support ticket review interface and is clearly wired for dean-role navigation. The backend itself supports role-based access for faculty, program chairs, deans, and associate deans.

### How administrators review support tickets
1. Log in using an authorized account.
2. Open the support area from the admin or dean insights workspace.
3. View the ticket list sorted by newest first.
4. Tap a ticket to open the detail modal.
5. Review student information, subject, message, date, and current status.
6. Use the status action button to move the ticket to the next state.

### Ticket information shown in the mobile UI
- ticket status badge
- created date
- ticket subject
- ticket message preview
- student name
- student email when available

### Ticket detail information shown in the modal
- full status
- date and time
- student name
- student email
- student code when available
- ticket subject
- full ticket message

### Status cycle used by the mobile app
The admin support service maps backend status values into UI-friendly status labels:
- `open` -> `pending`
- `in_progress` -> `in_review`
- `closed` or `resolved` -> `resolved`

From the mobile UI, the status cycle is:
- `pending` -> `in_review`
- `in_review` -> `resolved`
- `resolved` -> `pending`

### Automatic ticket state change on view
If an administrator opens a ticket detail view and the ticket is currently `pending`, the mobile app automatically attempts to update it to `in_review`.

### Response handling status
The mobile detail view includes a response area, but the current mobile service defines `SUPPORT_TICKET_RESPONSES_SUPPORTED = false`. Because of that, the interface currently informs the admin that ticket responses are not yet supported by the server.

---

## System Flow

### Student Help Center flow
1. The student opens the shared help modal.
2. The modal calls `getFAQs()` from the mobile help service.
3. The help service requests `GET /api/support/faqs`.
4. The backend returns grouped or flat FAQ data based on category filtering.
5. The mobile app normalizes the FAQ payload and displays the entries.
6. If FAQ loading fails, the app falls back to built-in FAQ data.

### Student ticket submission flow
1. The student opens the `Support` tab in the help modal.
2. The student enters category, subject, and message.
3. The mobile app validates the input locally.
4. The help service posts the request to `POST /api/support-tickets`.
5. The backend validates and stores the ticket in `support_tickets`.
6. The mobile app shows success or error feedback.

### Admin support review flow
1. The admin opens the support ticket screen.
2. The mobile screen calls `getSupportTickets()`.
3. The admin support service requests `GET /api/admin/support/tickets`.
4. The backend applies role-based filtering and returns ticket data.
5. The mobile app normalizes ticket records and displays them in a list.
6. When an item is opened, the app requests `GET /api/admin/support/tickets/{id}`.
7. If the ticket is `pending`, the mobile app attempts to update it to `in_review`.
8. When the admin taps the status action button, the app sends `PATCH /api/admin/support/tickets/{id}` with the next status.

---

## API Usage

### Public support endpoints

#### `GET /api/support/faqs`
Purpose: Retrieve active FAQ entries.

Behavior:
- public access
- supports optional category filtering
- may return grouped FAQ data by category
- used by the student Help Center FAQ tab

#### `GET /api/support/categories`
Purpose: Retrieve FAQ category records.

Behavior:
- public access
- returns FAQ categories ordered by display order
- supported by the backend and help service

### Authenticated support endpoints

#### `POST /api/support-tickets`
Purpose: Create a support ticket for the authenticated user.

Main request values used by mobile:
- `subject`
- `message`
- `issue_type`

Main backend validation:
- subject required
- description/message required
- minimum 10 characters
- category must resolve to an allowed value

#### `GET /api/support-tickets/me`
Purpose: Retrieve the authenticated user's own support tickets.

Behavior:
- returns only the requesting user's tickets
- supports optional status filtering

### Admin support endpoints

#### `GET /api/admin/support/tickets`
Purpose: Retrieve support tickets for authorized admin or staff users.

Behavior:
- returns ticket queue data
- sorted by newest first
- supports filtering by status, priority, and category
- applies role-based campus and program scoping

#### `GET /api/admin/support/tickets/{id}`
Purpose: Retrieve a single support ticket with student details.

Behavior:
- used by the mobile detail modal
- returns student information and ticket detail fields

#### `PATCH /api/admin/support/tickets/{id}`
Purpose: Update a ticket's status or priority.

Supported backend status values:
- `open`
- `in_progress`
- `resolved`
- `closed`

The mobile UI currently uses status updates for review and resolution actions.

---

## Role-Based Access and Scope

### Students
- Can open the Help Center
- Can read FAQs
- Can submit support requests
- Can access their own ticket records through the authenticated endpoint

### Faculty
- Can access admin ticket listing endpoints in the backend
- Can view tickets within role-based scope
- Current mobile screen implementation shows the admin support workflow, but ticket update permission in the backend is more restricted

### Program Chair
- Can access admin ticket listing and detail endpoints
- Can update ticket status
- Data is scoped to the same campus and program

### Associate Dean
- Can access admin ticket listing and detail endpoints
- Can update ticket status
- Data is scoped to the same campus

### Dean
- Can access admin ticket listing and detail endpoints
- Can update ticket status
- Sees the broadest support ticket scope

---

## Validation, Error Handling, and Current Limitations

### Validation and feedback
- The student support form blocks submission when required fields are empty
- The student support form requires at least 10 characters in the message
- Backend validation returns clear validation errors when the payload is invalid

### Error handling
- FAQ loading falls back to default FAQ entries when the API request fails
- Support submission returns user-friendly error messages when possible
- Admin ticket loading failures show an error toast
- Ticket detail loading failures close the modal and show an error toast

### Current limitations confirmed by the implementation
- Admin reply submission is not active in the current mobile service
- The user-facing mobile documentation should not claim live ticket conversations
- The role-based shared help modal behaves differently for non-student users:
  - students see `FAQs` and `Support`
  - non-students see an announcement creation flow
- The standalone `Help Center` screen currently contains static FAQ text and a guidance card, while the shared modal provides the fuller interactive support flow used in the app

---

## Notes
- This document was written to match the currently implemented mobile and backend support workflows.
- It avoids unsupported claims such as confirmed two-way support chat inside the mobile app.
- If future releases add working ticket responses, student ticket history screens, or richer help search and filtering, this document should be updated.

---

*End of Document*
