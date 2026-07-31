# CAPS Automation Framework

Playwright automation framework for the **CAPS (Computer-Aided Preparation System)**.

---

# Features

- ✅ Reusable helper functions
- ✅ Dynamic test data
- ✅ Multiple user roles
- ✅ Sequential execution
- ✅ JSON storage for generated entities
- ✅ Centralized authentication
- ✅ Reusable image uploads
- ✅ Easy to extend

---

# Project Structure

```
tests/
│
├── Helpers/
│   ├── auth.ts
│   ├── navigation.ts
│   ├── storage.ts
│   ├── upload.ts
│   └── waits.ts
│
├── data/
│   ├── classes.json
│   ├── question_quiz.json
│   ├── quizzes.json
│   └── subjects.json
│
├── assets/
│   └── images/
│       ├── Untitled design.png
│       └── 7u7caf.png
│
├── Dean/
├── Asso_Dean/
├── PROGRAM_CHAIR/
│
└── run-all.cjs
```

---

# Architecture

```
Test Script
      │
      ▼
 Helper Functions
      │
      ▼
 Playwright Actions
      │
      ▼
 CAPS Website
      │
      ▼
 JSON Storage
```

---

# Helper Files

## auth.ts

Responsible for authentication.

Instead of writing login code in every script,

```ts
await login(
    page,
    process.env.ASSO_DEAN_USERNAME!,
    process.env.ASSO_DEAN_PASSWORD!
);
```

auth.ts automatically

- Opens CAPS
- Clicks Login
- Enters credentials
- Signs in
- Closes announcements

---

## navigation.ts

Contains reusable navigation helpers.

Example:

```ts
await gotoQuestions(page);

await gotoQuizzes(page);

await gotoClasses(page);
```

Instead of repeating navigation code.

---

## upload.ts

Centralized image uploading.

Instead of

```ts
await page
.locator(...)
.setInputFiles(...)
```

future helper:

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

Avoids using

```ts
waitForTimeout()
```

throughout the project.

---

## storage.ts

Stores generated data.

Example

```ts
saveClass(className);

saveQuizQuestion(questionTitle);

saveSubject(subjectName);
```

Retrieves data later.

```ts
const latestQuestion = getLatestQuizQuestion();
```

No hardcoded names required.

---

# Data Storage

Generated entities are stored inside

```
tests/data/
```

Example

question_quiz.json

```json
{
    "questions": [
        "Quiz Question-1784627001",
        "Quiz Question-1784627002"
    ]
}
```

classes.json

```json
{
    "classes": [
        "Class-1784629001",
        "Class-1784629002"
    ]
}
```

Benefits

- Dynamic scripts
- Independent tests
- No hardcoded values

---

# Assets

All reusable images are stored inside

```
tests/assets/images
```

Example

```
Untitled design.png

7u7caf.png
```

Usage

```ts
.setInputFiles(
    'assets/images/Untitled design.png'
);
```

---

# Current Automation

## Login

- Login

---

## Classes

- Add Class
- Archive Class
- Restore Class
- Delete Class

---

## Subjects

- Add Subject

---

## Question Bank

- Add Question
- Edit Question
- Copy Question
- Remove Question
- Approve Question

---

## Quiz

- Create Quiz
- Edit Quiz
- Archive Quiz
- Restore Quiz

---

## Quiz Questions

- Add Question
- Copy Question
- Edit Question
- Remove Question
- Assign Question

---

# Dynamic Workflow

```
Create Question
       │
       ▼
Generate Unique Name
       │
       ▼
Save to question_quiz.json
       │
       ▼
Copy Script
       │
       ▼
Read JSON
       │
       ▼
Edit Script
       │
       ▼
Read JSON
       │
       ▼
Remove Script
```

No script depends on manually typed names.

---

# Running Tests

Run a single test

```bash
npx playwright test tests/Asso_Dean/Quiz/add_question_quiz.spec.ts
```

Run all tests

```bash
node tests/run-all.cjs
```

---

# Best Practices

## ✅ Use helper functions

Instead of

```ts
await page.goto(...);
```

Use

```ts
await login(...);
```

---

## ✅ Store generated entities

Whenever creating

- Class
- Subject
- Quiz
- Question

save them immediately.

Example

```ts
saveClass()

saveQuizQuestion()

saveSubject()
```

---

## ✅ Clear JSON before creating new entities

Example

```ts
clearQuizQuestions();
```

This prevents old data from interfering with new test runs.

---

## ✅ Use assets folder

Do not use

```
Desktop/image.png
```

Always use

```
assets/images/image.png
```

---

## ✅ Avoid hardcoded names

❌

```ts
Quiz Question-1784627048876
```

✅

```ts
const question = getLatestQuizQuestion();
```

---

# Workflow Order

```
Login
    │
    ▼
Create Subject
    │
    ▼
Create Quiz
    │
    ▼
Create Question
    │
    ▼
Save Question
    │
    ▼
Copy Question
    │
    ▼
Edit Question
    │
    ▼
Assign Question
    │
    ▼
Remove Question
```

---

# Future Improvements

- Page Object Model (POM)
- Better locator strategy (replace `.nth()` where possible)
- Automatic screenshots on failure
- HTML reports
- GitHub Actions CI/CD
- Retry mechanism
- Parallel execution
- Dynamic test configuration
- Automatic cleanup after tests