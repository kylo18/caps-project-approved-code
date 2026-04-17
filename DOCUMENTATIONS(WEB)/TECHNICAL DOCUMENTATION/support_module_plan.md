# 🛠️ CAPS Implementation Plan: Customer Support Module

This document outlines the structured plan to implement the **User / Customer Support Module** within the CAPS ecosystem.

## 🎯 Objective
Provide a built-in support experience so users can quickly find answers to common questions via an FAQ and submit detailed support requests without leaving CAPS.

---

## 🏗️ Phase 1: Backend Architecture (Support Tickets)

### 1. Database Schema
We will create a new tracking table for support tickets.
**Table:** `support_tickets`
- `id` (PK, Primary Key)
- `user_id` (FK, references `users.userID`)
- `issue_type` (Enum/String: e.g., 'Technical', 'Account', 'General')
- `subject` (String)
- `message` (Text)
- `status` (String/Enum: 'Open', 'In Progress', 'Resolved', default: 'Open')
- `created_at` / `updated_at` (Timestamps)

### 2. API Endpoints
All endpoints will be protected by Sanctum middleware (`auth:sanctum`).
- **`POST /api/support-tickets`**: Create a new ticket.
    - *Validation*: `issue_type` (required), `subject` (required/max:255), `message` (required).
- **`GET /api/support-tickets`**: Fetch tickets (Restricted to Admin role).
- **`GET /api/support-tickets/me`**: Fetch the current mapped user's ticket history.

### 3. Automated Notifications
- When a `POST /api/support-tickets` is successfully saved, we will hook into our existing `EmailNotificationService`.
- A background **queued email** will be sent to the system administrator alerting them of a new support ticket.

---

## 🖥️ Phase 2: Frontend Implementation (Support & Help UI)

### 1. Layout Design
A dedicated "Help & Support" dedicated panel featuring a split-view design.
- **Left Side (FAQ Accordion)**: Interactive list of the curated Top Questions.
- **Right Side (Support Request Form)**: The submission form for direct help.

### 2. FAQ Content Implementation
Curated static list (or fetched state):
- "How do I start a new exam?"
- "How is my rank calculated?"
- "Why are my notifications not showing?"
- "How do I use Google Login?"

### 3. Form & State Management
- Dropdown for `Issue Type`.
- Inputs for `Subject` and `Message`.
- Loading spinners during API submission.
- Success modals/toasts upon successful backend creation.

---

## 🧪 Phase 3: Quality Assurance
- **Form Validation**: Trigger frontend errors for empty or invalid inputs.
- **Backend Rejection**: Attempt submissions without a valid auth token to ensure security.
- **Queue Verification**: Ensure the admin notification email processes successfully in `php artisan queue:work`.
- **Database Integrity**: Confirm tickets are accurately linked to the submitting User ID.
