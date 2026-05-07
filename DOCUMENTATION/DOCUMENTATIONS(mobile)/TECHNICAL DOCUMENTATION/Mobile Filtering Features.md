# Mobile Filtering Features

## Purpose
This document explains the filtering features that are currently implemented in the CAPS mobile application. It focuses on actual user-facing filter behavior found in the current mobile frontend and avoids unsupported assumptions.

---

## Scope Note
This document covers implemented filtering and search behavior in the mobile application, including:
- student filters
- faculty filters
- program chair filters
- dean and associate dean filters
- question review filters
- leaderboard filters

This document does not claim that every screen has advanced filtering. It only describes filtering behavior that is clearly present in the current mobile implementation.

---

## Table of Contents
1. [Overview](#overview)
2. [Student Filtering Features](#student-filtering-features)
3. [Faculty Filtering Features](#faculty-filtering-features)
4. [Program Chair Filtering Features](#program-chair-filtering-features)
5. [Dean and Associate Dean Filtering Features](#dean-and-associate-dean-filtering-features)
6. [How Filtering Works in the System](#how-filtering-works-in-the-system)
7. [Notes](#notes)

---

## Overview
The CAPS mobile application uses filtering to help users narrow large sets of information and find relevant records faster. The current mobile implementation includes both simple filters and multi-condition filters depending on the screen.

The implemented filtering approaches include:
- search-based filtering
- chip-based filtering
- segmented filters
- tab-based filtering
- dropdown-based filtering
- role-based list filtering
- status-based filtering
- program and subject filtering

In many screens, filtering happens locally after data has already been loaded into the app. In some screens, selected filter values are also passed into service requests.

---

## Student Filtering Features

### 1. Practice History Filter
Screen: student `practice-history`

Implemented filters:
- `All`
- `Passed`
- `Failed`

How it works:
- The app loads the student practice history.
- The selected chip changes the visible list.
- `Passed` shows entries with scores of `75` and above.
- `Failed` shows entries with scores below `75`.

Purpose:
- Helps students quickly review successful and unsuccessful exam attempts.

---

### 2. Subject Search and Category Filter
Screen: student `search`

Implemented filters:
- `All`
- `Program`
- `General`

Implemented search behavior:
- search by subject name
- search by subject code

How it works:
- The app loads available practice subjects.
- The user can search using text input.
- The user can also apply category chips:
  - `Program` keeps subjects with a `programID`
  - `General` keeps subjects without a `programID`
  - `All` shows the full set

Purpose:
- Helps students locate practice subjects more quickly and separate program-based subjects from general subjects.

---

### 3. Leaderboard Filter Sheet
Screen: student `leaderboard`

Implemented filters:
- period filter:
  - `Weekly`
  - `All Time`
- program filter
- subject filter

How it works:
- The segmented control switches the leaderboard period.
- A filter sheet opens when the user taps the filter control.
- Inside the filter sheet, the user can choose:
  - `All Programs` or a specific program
  - `All Subjects` or a specific subject
- The app reloads leaderboard data whenever the selected period, program, or subject changes.

Purpose:
- Helps students compare rankings in a more focused way, especially by program or subject.

---

### 4. Practice Exam Result Review Filter
Screen: `practice-exam/results`

Implemented filters:
- `All Questions`
- `Correct`
- `Incorrect`

How it works:
- After an exam, the question review section uses tabs to filter the result list.
- `Correct` shows only correct answers.
- `Incorrect` shows only incorrect answers.
- `All Questions` restores the full review list.

Purpose:
- Helps students review mistakes faster and focus on weak areas.

---

## Faculty Filtering Features

### 1. User Management Filters
Screen: faculty `users`

Implemented filters:
- search filter
- role filter
- status filter
- advanced filters:
  - program
  - year
  - campus

Role filter options:
- `All`
- `Admins`
- `Students`

Status filter options:
- `All`
- `Pending`
- `Active`
- `Inactive`
- `Disapproved`

Search fields used:
- first name
- last name
- email
- user code

How it works:
- The screen loads the full user list.
- Filtering is then applied locally based on the active selections.
- The advanced filter panel opens when the options button is tapped.
- Program, year, and campus use dropdown-style selection.

Purpose:
- Helps faculty narrow user records without scrolling through the full list.

---

### 2. Class Search Filter
Screen: faculty `classes`

Implemented filtering behavior:
- search by class name
- search by class code
- search by subject code
- search by subject name
- search by schedule

Purpose:
- Helps faculty quickly find a specific class from the class list.

---

## Program Chair Filtering Features

### 1. User Management Filters
Screen: program chair `users`

Implemented filters:
- search filter
- role filter
- status filter
- advanced filters:
  - program
  - year
  - campus

This works in the same general way as the faculty and dean user management filters, with local filtering applied to the loaded user list.

Purpose:
- Helps program chairs focus on users relevant to the selected category or academic grouping.

---

### 2. Class Search Filter
Screen: program chair `classes`

Implemented filtering behavior:
- search by class name
- search by class code
- search by subject code
- search by subject name
- search by schedule

Purpose:
- Helps program chairs quickly locate relevant classes in the mobile class overview.

---

## Dean and Associate Dean Filtering Features

### 1. User Management Filters
Screens:
- dean `users`
- associate dean `users`

Implemented filters:
- search filter
- role filter
- status filter
- advanced filters:
  - program
  - year
  - campus

Role filter options:
- `All`
- `Admins`
- `Students`

Status filter options:
- `All`
- `Pending`
- `Active`
- `Inactive`
- `Disapproved`

Advanced dropdown filters:
- `Program`
- `Year`
- `Campus`

Search fields used:
- first name
- last name
- email
- user code

Additional behavior:
- dashboard shortcuts can open the users screen with a preselected role filter in some cases

Purpose:
- Helps administrators narrow large user lists and review specific user groups faster.

---

### 2. Class Search Filter
Screens:
- dean `classes`
- associate dean `classes`

Implemented filtering behavior:
- search by class name
- search by class code
- search by subject code
- search by subject name
- search by schedule

Purpose:
- Helps administrators quickly locate classes in the oversight workflow.

---

### 3. Question Search Filter
Screen: dean `subjects`

Implemented filtering behavior:
- search by question text
- search by topic
- search by subject name

How it works:
- Questions are loaded for the selected subject.
- The search input narrows the visible question list.
- The current implementation is search-based and does not expose a separate status chip filter in the main list.

Purpose:
- Helps administrators find specific questions in the subject question bank more quickly.

---

### 4. Unified Enhancement Student Filters
Screen: `AdminUnifiedEnhancementScreen`

Implemented filters:
- program filter
- student search filter

How it works:
- The screen loads student and analytics data.
- Program filtering narrows students by normalized program value.
- Search filtering matches student name and email.
- Both conditions are applied together to produce the visible student list.

Purpose:
- Helps deans and associate deans review student data with a more focused student subset.

Note:
- The current file includes a comment that performance-based filters are limited because per-student score filtering is not fully available from the current backend data.

---

## How Filtering Works in the System

### Local filtering
Many mobile screens load a dataset first, then filter the visible records in memory using:
- active chip values
- selected dropdown values
- search text
- tab state

This is common in:
- user management screens
- practice history
- subject search
- question review
- class lists

### Request-driven filtering
Some filters affect the service request itself.

This is clearly present in:
- student leaderboard, where period, program, and subject selections are passed into the leaderboard service request

### Combined filtering
Some screens use multiple filters together.

Examples:
- user management combines search, role, status, program, year, and campus
- student leaderboard combines period, program, and subject
- unified enhancement combines program and search

---

## Notes
- This document was written to reflect currently implemented mobile filtering behavior.
- Search and filtering are not identical on every screen. Some screens use only search, while others use several filters together.
- Several filters are role-specific and appear only in administrative or faculty workflows.
- If new chips, dropdowns, analytics filters, or backend-driven filtering options are added later, this document should be updated.

---

*End of Document*
