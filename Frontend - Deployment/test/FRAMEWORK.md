# Framework Documentation

## Architecture

```
Spec File
     │
     ▼
Helpers
     │
     ▼
Playwright
     │
     ▼
CAPS
     │
     ▼
JSON Storage
```

---

# Helpers

## auth.ts

Logs into CAPS.

```ts
await login(
    page,
    username,
    password
);
```

---

## storage.ts

Stores generated entities.

Supported

- Classes
- Quiz Questions
- Subjects

Functions

```ts
saveClass()

getClasses()

clearClasses()

saveQuizQuestion()

getQuizQuestions()

getLatestQuizQuestion()

clearQuizQuestions()

saveSubject()

getSubjects()

clearSubjects()
```

---

## upload.ts

Reusable upload helper.

---

## waits.ts

Reusable waiting utilities.

---

## navigation.ts

Reusable navigation methods.

---

# Assets

```
assets/images
```

Stores reusable images.

---

# Data

```
tests/data
```

Stores

```
classes.json

subjects.json

question_quiz.json
```

Generated automatically during execution.