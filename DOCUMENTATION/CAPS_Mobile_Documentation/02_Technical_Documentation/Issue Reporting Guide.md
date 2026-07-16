# Issue Reporting Guide

## Purpose
This document explains how issue reporting currently works in the CAPS mobile system based on the `FrontendMobile` folder. It focuses on the implemented student support request flow and the administrator support ticket review flow. It also explains the available issue categories, the reporting steps, and the movement of a report from submission to review.

## Mobile Scope
This document is written for the CAPS mobile app only and reflects the current `FrontendMobile` implementation. It does not describe web-only or backend-only behavior.

Last updated: May 27, 2026

This document has been reviewed and updated for the current CAPS mobile system.

---

## Scope Note
This guide is based on the currently implemented mobile support workflow. In the present CAPS mobile implementation, issue reporting is mainly handled through the `Help Center` support form for students and the `Support Tickets` review screen for authorized administrators.

This document does not describe a live chat or full two-way support conversation because that behavior is not fully supported in the current mobile service.

Frontend files referenced by this guide:
- `src/features/support/components/HelpCenterModal.tsx`
- `src/services/helpService.ts`
- `src/services/adminSupportService.ts`
- `app/(auth)/(dean)/support.tsx`

---

## Intended Users
- Student
- Dean
- Associate Dean
- Program Chair
- Faculty

Note: The student role is the main role that submits issue reports in the mobile UI. The admin-side support review flow is implemented most clearly in the dean support workspace, while backend access also supports other authorized academic roles based on role rules.

---

## Table of Contents
1. [Overview](#overview)
2. [Issue Categories](#issue-categories)
3. [Student Reporting Flow](#student-reporting-flow)
4. [Admin Review Flow](#admin-review-flow)
5. [System Flow](#system-flow)
6. [Validation and Error Handling](#validation-and-error-handling)
7. [UI Screenshots](#ui-screenshots)
8. [Notes](#notes)

---

## Overview
The current issue reporting process in CAPS mobile works like this:

1. A student opens the `Help Center`.
2. The student switches to the `Support` tab.
3. The student selects an issue category.
4. The student enters a subject and a detailed message.
5. The app submits the report as a support ticket.
6. An authorized admin opens the `Support Tickets` screen.
7. The admin reviews the ticket and updates its status.

This process helps the system collect concerns in a more organized way instead of using informal messages or unclear reports.

---

## Issue Categories
The student issue reporting form currently provides these categories:

### 1. `General`
Use this for concerns that do not clearly fit the other categories.

Examples:
- general questions about app behavior
- unclear user guidance
- concerns that need clarification first

### 2. `Technical`
Use this for technical problems in the app.

Examples:
- screen not loading
- button not working
- class quiz not opening
- app behavior that looks broken or incorrect

### 3. `Account`
Use this for account and access concerns.

Examples:
- login problem
- account access issue
- profile-related concern

### 4. `Academic`
Use this for learning, subject, exam, quiz, or class-related concerns.

Examples:
- practice exam issue
- class quiz issue
- subject-related problem
- concern about academic content access

### 5. `Other`
Use this when the issue does not properly fit the listed categories.

---

## Student Reporting Flow

### How students report an issue
1. Log in to the CAPS mobile application.
2. Open the `Help Center` from the available mobile entry point.
3. Switch from the `FAQs` tab to the `Support` tab.
4. Select the most appropriate issue category.
5. Enter a short subject that summarizes the issue.
6. Enter a detailed message explaining the issue.
7. Tap `Submit Request`.
8. Wait for the success message from the app.

### What students should include in the report
To make issue reporting more useful, the student should include:
- what problem happened
- where it happened
- what they were trying to do
- what result they expected
- what result actually happened

Example:
`I joined the class successfully, but when I tap the class quiz, the app goes back to the dashboard instead of opening the quiz.`

### What the app sends
When the form is submitted, the mobile app sends:
- `subject`
- `message`
- `issue_type`

The backend then normalizes this into a support ticket category and stores the report in the support ticket system.

---

## Admin Review Flow

### How admins review reported issues
1. Log in using an authorized account.
2. Open the `Support Tickets` screen from the admin support area.
3. Review the ticket list.
4. Tap a ticket to open the detailed view.
5. Read the student details, subject, and message.
6. Update the ticket status using the available action button.

### Current ticket status flow in the mobile UI
The admin support UI uses these status labels:
- `Pending`
- `In Review`
- `Resolved`

The current mobile ticket cycle is:
- `Pending` -> `In Review`
- `In Review` -> `Resolved`
- `Resolved` -> `Pending`

### Current limitation
The admin detail view includes a response area, but the current mobile service indicates that ticket responses are not yet supported by the server. Because of that, the issue review flow is mainly status-based in the current implementation.

---

## System Flow

### Student-side flow
1. Student opens the shared help modal.
2. Student moves to the `Support` tab.
3. Student chooses a category and fills in the form.
4. Local validation checks whether the fields are complete.
5. The app sends the request to the support ticket endpoint.
6. The backend stores the issue as a support ticket.

### Admin-side flow
1. Admin opens the support ticket screen.
2. The mobile app loads the ticket list from the backend.
3. Admin selects a ticket.
4. The app opens the ticket detail modal.
5. If the ticket is still new or pending, the app may move it into review state.
6. The admin updates the ticket to the next status as needed.

---

## Validation and Error Handling

### Student form rules
The form currently requires:
- a subject
- a message
- a message with at least 10 characters

### Error handling behavior
- If required fields are empty, the app blocks submission.
- If the message is too short, the app shows an error prompt.
- If submission fails, the app shows a failure message.
- If submission succeeds, the app shows a success message.

---

## UI Reference

The student issue reporting UI is implemented in `HelpCenterModal.tsx`. Students see a bottom modal with:
- `FAQs` and `Support` tabs
- category chips
- subject input
- message input
- submit button

The admin review UI is implemented through the support ticket screen and `adminSupportService.ts`. Administrators see:
- ticket cards
- status badges
- student identity details where available
- ticket detail modal
- status action button

No screenshot asset files are currently present beside this Markdown file, so this document references the implemented frontend files instead of linking missing images.

---

## Notes
- This guide reflects the currently implemented support request workflow in the CAPS mobile system.
- The main student-side issue reporting categories are `General`, `Technical`, `Account`, `Academic`, and `Other`.
- The current admin-side issue handling flow is status-based and does not yet confirm full ticket reply support in the mobile service.
- If the project later adds richer issue reporting, attachments, or full support conversations, this document should be updated.

---

*End of Document*
