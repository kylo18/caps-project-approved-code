# CAPS Playwright Automation Guide

---

# Table of Contents

1. Prerequisites
2. Project Setup
3. Folder Structure
4. Environment Variables
5. Running Tests
6. Helper Files
7. Data Storage
8. Creating a New Test
9. Best Practices
10. Troubleshooting

---

# Prerequisites

Before running the automation framework, install the following:

- Node.js (v20 or later recommended)
- Visual Studio Code
- Git
- Playwright

Verify installation:

```bash
node -v
npm -v
```

---

# Project Setup

## 1. Clone the repository

```bash
git clone <repository-url>
cd <project-folder>
```

---

## 2. Install dependencies

```bash
npm install
```

---

## 3. Install Playwright browsers

```bash
npx playwright install
```

---

## 4. Verify installation

```bash
npx playwright test --version
```

---

# Environment Variables

Create a `.env` file in the project root.

Example

```env
DEAN_USERNAME=
DEAN_PASSWORD=

ASSO_DEAN_USERNAME=
ASSO_DEAN_PASSWORD=

PROGRAM_CHAIR_USERNAME=
PROGRAM_CHAIR_PASSWORD=

FACULTY_USERNAME=
FACULTY_PASSWORD=
```

Scripts access credentials using

```ts
process.env.DEAN_USERNAME
process.env.DEAN_PASSWORD
```

---

# Folder Structure

```
tests/

    Helpers/
        auth.ts
        navigation.ts
        storage.ts
        upload.ts
        waits.ts

    data/
        classes.json
        quizzes.json
        question_quiz.json
        subjects.json

    assets/
        images/

    Dean/

    Asso_Dean/

    PROGRAM_CHAIR/

run-all.cjs
```

---

# Running Tests

Run one test

```bash
npx playwright test tests/Dean/questions/add-question.spec.ts
```

Run one folder

```bash
npx playwright test tests/Dean
```

Run everything

```bash
node tests/run-all.cjs
```

---

# Helper Files

## auth.ts

Responsible for login.

Usage

```ts
await login(
    page,
    process.env.DEAN_USERNAME!,
    process.env.DEAN_PASSWORD!
);
```

---

## storage.ts

Stores generated data.

Example

```ts
saveClass(className);

saveQuizQuestion(questionTitle);

saveSubject(subjectName);
```

Retrieve

```ts
getClasses();

getQuizQuestions();

getLatestQuizQuestion();
```

Clear

```ts
clearClasses();

clearQuizQuestions();

clearSubjects();
```

---

## upload.ts

Stores reusable upload functions.

Future usage

```ts
await uploadQuestionImage(page);
```

---

## waits.ts

Contains reusable waits.

Example

```ts
await waitForLoading(page);
```

---

# JSON Storage

Generated entities are stored inside

```
tests/data
```

Example

```
classes.json
```

```json
{
    "classes":[
        "Class-1784627001",
        "Class-1784627002"
    ]
}
```

Example

```
question_quiz.json
```

```json
{
    "questions":[
        "Quiz Question-1784627001",
        "Quiz Question-1784627002"
    ]
}
```

---

# Assets

Reusable images belong in

```
tests/assets/images
```

Use

```ts
.setInputFiles(
    'assets/images/Untitled design.png'
);
```

Do **not** use

```
Desktop/image.png
```

---

# Automation Coverage

## DEAN

### Authentication

- Login

### Subject

- Add Subject

### Question Bank

- Add Question
- Edit Question
- Remove Question
- Approve Question
- Copy & Edit Question

### Practice Exam

- Set Up Practice Exam
- Undo Practice Exam

### Class

- Add Class
- Archive Class
- Restore Class
- Delete Class

### Quiz

- Create Subject-based Quiz
- Create Custom Quiz
- Edit Quiz
- Archive Quiz
- Restore Quiz

### Quiz Questions

- Add Quiz Question
- Copy Quiz Question
- Edit Quiz Question
- Remove Quiz Question
- Assign Quiz

---

## ASSOCIATE DEAN

### Authentication

- Login

### Subject

- Add Subject

### Question Bank

- Add Question
- Edit Question
- Remove Question
- Approve Question
- Copy & Edit Question

### Practice Exam

- Set Up Practice Exam
- Undo Practice Exam

### Class

- Add Class
- Archive Class
- Restore Class
- Delete Class

### Quiz

- Create Subject-based Quiz
- Create Custom Quiz
- Edit Quiz
- Archive Quiz
- Restore Quiz

### Quiz Questions

- Add Quiz Question
- Copy Quiz Question
- Edit Quiz Question
- Remove Quiz Question
- Assign Quiz

---

## PROGRAM CHAIR

### Authentication

- Login

### Question Bank

- Add Question
- Edit Question
- Remove Question
- Approve Question
- Copy & Edit Question

### Practice Exam

- Set Up Practice Exam
- Undo Practice Exam

---

## FACULTY

### Authentication

- Login

### Subject

- Assign Subject

### Question Bank

- Add Question
- Edit Question
- Remove Question
- Copy & Edit Question

---

# Creating a New Test

## Step 1

Create a new spec file.

Example

```
Dean/Class/create-class.spec.ts
```

---

## Step 2

Import required helpers.

```ts
import { test, expect } from '@playwright/test';
import { login } from '../../Helpers/auth.js';
```

---

## Step 3

Login.

```ts
await login(
    page,
    process.env.DEAN_USERNAME!,
    process.env.DEAN_PASSWORD!
);
```

---

## Step 4

Navigate.

```ts
await page.getByRole(...);
```

---

## Step 5

If creating dynamic data

Generate a unique name.

```ts
const className =
    `Class-${Date.now()}`;
```

Save it.

```ts
saveClass(className);
```

---

## Step 6

Verify.

```ts
await expect(
    page.getByText(/success/i)
).toBeVisible();
```

---

# Best Practices

✅ Use helper functions

```ts
login();
```

instead of duplicating login code.

---

✅ Save generated entities.

```ts
saveClass();

saveQuizQuestion();

saveSubject();
```

---

✅ Clear JSON before creation.

```ts
clearQuizQuestions();
```

---

✅ Store images inside

```
assets/images
```

---

✅ Never hardcode generated names.

Instead of

```ts
Quiz Question-1784627001
```

use

```ts
const question =
getLatestQuizQuestion();
```

---

# Troubleshooting

## Cannot find module

Run

```bash
npm install
```

---

## Playwright browser missing

Run

```bash
npx playwright install
```

---

## Empty JSON error

Initialize the JSON file.

Example

```json
{
    "questions":[]
}
```

---

## Locator timeout

Check whether:

- The element exists.
- The page has finished loading.
- The selector has changed.
- The test data still exists.

---

## Login fails

Verify:

- `.env` credentials are correct.
- CAPS website is accessible.
- The account has permission for the tested module.

---

# Recommended Workflow

```
1. Login
        │
        ▼
2. Navigate
        │
        ▼
3. Perform Action
        │
        ▼
4. Save Generated Data
        │
        ▼
5. Verify Success
        │
        ▼
6. Continue to Next Test
```

Following this workflow keeps tests reusable, maintainable, and independent.