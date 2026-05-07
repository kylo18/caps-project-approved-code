# User Status Behavior

## Purpose
This document explains the behavior of the system based on user statuses and outlines the restrictions associated with each status. It serves as a guide to understand how user statuses impact system interactions.

---

## Table of Contents
1. [Overview of User Statuses](#overview-of-user-statuses)
2. [Student Statuses](#student-statuses)
   - [Active](#active)
   - [Inactive](#inactive)
   - [Suspended](#suspended)
3. [Admin Statuses](#admin-statuses)
   - [Active](#active-1)
   - [Inactive](#inactive-1)
   - [Restricted](#restricted)
4. [Restrictions Based on Status](#restrictions-based-on-status)
5. [Status Management](#status-management)

---

## Overview of User Statuses
User statuses determine the level of access and functionality available to users within the system. The statuses are categorized based on user roles (e.g., students, admins) and are updated dynamically based on system rules or manual intervention.

---

## Student Statuses

### Active
#### Description
- Students with an "Active" status have full access to all system features.

#### Features Available
- Access to courses, grades, and study materials.
- Participation in exams and quizzes.
- Ability to receive notifications and updates.

### Inactive
#### Description
- Students with an "Inactive" status have limited access to the system.

#### Restrictions
- Cannot participate in exams or quizzes.
- Cannot access grades or study materials.
- Notifications are limited to account-related updates.

### Suspended
#### Description
- Students with a "Suspended" status are temporarily barred from accessing the system.

#### Restrictions
- No access to any system features.
- Notifications are disabled.
- Account reactivation requires admin intervention.

---

## Admin Statuses

### Active
#### Description
- Admins with an "Active" status have full access to all administrative features.

#### Features Available
- Manage users, courses, and system settings.
- Access analytics and reports.
- Send notifications to users.

### Inactive
#### Description
- Admins with an "Inactive" status have limited access to the system.

#### Restrictions
- Cannot manage users or courses.
- Cannot access analytics or reports.
- Notifications are limited to account-related updates.

### Restricted
#### Description
- Admins with a "Restricted" status have severely limited access due to policy violations or other reasons.

#### Restrictions
- Cannot perform any administrative actions.
- Access is limited to viewing account details.
- Notifications are disabled.

---

## Restrictions Based on Status
### General Restrictions
1. **Access to Features**
   - Inactive and suspended users cannot access core features.
2. **Notifications**
   - Notifications are limited or disabled for restricted statuses.
3. **Account Management**
   - Suspended and restricted users cannot update their account details.

### Specific Restrictions
| Status       | Access to Features | Notifications | Account Updates |
|--------------|--------------------|---------------|-----------------|
| Active       | Full               | Enabled       | Allowed         |
| Inactive     | Limited            | Limited       | Allowed         |
| Suspended    | None               | Disabled      | Not Allowed     |
| Restricted   | None (Admins only) | Disabled      | Not Allowed     |

---

## Status Management
### Updating Status
1. Admins can update user statuses from the "User Management" section.
2. Select the user and choose the new status from the dropdown menu.
3. Confirm the changes to apply the new status.

### Notifications for Status Changes
- Users are notified when their status changes (if notifications are enabled for their current status).
- Suspended and restricted users do not receive notifications.

### Reactivating Accounts
1. Suspended or inactive users can request reactivation through the "Help" section.
2. Admins review the request and update the status if approved.

---

## Notes
- Ensure that status changes are communicated clearly to users.
- Regularly review user statuses to maintain system integrity.
- Contact support for assistance with status-related issues.

---

*End of Document*