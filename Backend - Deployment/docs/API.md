# CAPS API Reference

Technical reference for the HTTP API defined in `routes/api.php`. This application is a Laravel backend using **Laravel Sanctum** for API token authentication.

---

## Base URL and prefix  

Unless your deployment overrides routing, Laravel registers these routes under the **`/api`** prefix.

| Environment | Example base URL |
|-------------|------------------|
| Local (typical) | `http://localhost:8000/api` |
| Production | `https://{your-domain}/api` |

All paths in this document are **relative to that base** (e.g. `POST /login` means `POST https://example.com/api/login`).

**Content type:** Request bodies are typically `application/json` unless an endpoint explicitly expects multipart form data (e.g. some file uploads in controllers).

---

## Authentication

### Obtaining a token

1. `POST /register` or `POST /login` returns an access token (implementation-specific shape; see `AuthController`).
2. Send the token on subsequent requests:

```http
Authorization: Bearer {access_token}
Accept: application/json
```

### Sanctum (`auth:sanctum`)

Most endpoints require a valid Bearer token. Missing or invalid tokens yield **401 Unauthorized** (or framework-equivalent responses).

### Role middleware (`role:{ids}`)

Some route groups restrict access by **numeric role ID**:

| roleID | Intended role (per route comments) |
|--------|-----------------------------------|
| 1 | Student |
| 2 | Faculty |
| 3 | Program Chair |
| 4 | Dean |
| 5 | Associate Dean |

Unauthorized roles typically receive **403 Forbidden**.

### Token expiration (faculty and elevated staff)

The middleware stack **`auth:sanctum` + `TokenExpirationMiddleware` + `role:2,3,4,5`** applies to the large faculty/admin-style group. Only that group uses `TokenExpirationMiddleware` in this file; other authenticated groups do not.

---

## Conventions

- **Path parameters** use the names shown in the route (`subjectID`, `classID`, `userID`, etc.). Types are logical IDs (usually integers) unless the controller accepts strings (e.g. join tokens, filenames).
- **Errors:** Laravel validation and HTTP exceptions return JSON with conventional Laravel structure (`message`, `errors`, etc.).
- **Static assets:** Two `GET` routes serve files from `public/storage/` with CORS middleware for PDF/image workflows.

---

## Duplicate routes (Laravel ordering)

Laravel matches the **first** registered route for the same HTTP method and path. The following pairs are defined twice with different role middleware:

| Method & path | Faculty/staff group | Student group |
|---------------|--------------------|---------------|
| `GET /quiz-results` | `role:2,3,4,5` | `role:1` |
| `GET /quiz-results/{id}` | `role:2,3,4,5` | `role:1` |

Because the faculty routes are registered **before** the student routes, student calls may hit the faculty route first and receive **403**. If that appears in production, resolve by using distinct paths (e.g. `/student/quiz-results`) or registering the student routes first—whichever matches product requirements.

---

# Endpoint catalog

## 1. Public (no authentication)

| Method | Path | Controller action | Description |
|--------|------|-------------------|-------------|
| POST | `/register` | `AuthController@register` | User registration |
| POST | `/login` | `AuthController@login` | Login; issue API token |
| GET | `/roles` | `RoleController@indexAvailableRoles` | List roles available at registration |
| POST | `/forgot-password` | `PasswordResetController@sendResetLinkEmail` | Request password reset email |
| POST | `/reset-password` | `PasswordResetController@reset` | Complete password reset |
| GET | `/app-version` | `AppController@getVersion` | Application version metadata |

---

## 2. Authenticated — any role (`auth:sanctum`)

**Middleware:** `auth:sanctum` only.

| Method | Path | Controller action | Description |
|--------|------|-------------------|-------------|
| POST | `/change-password` | `AuthController@changePassword` | Change password |
| POST | `/logout` | `AuthController@logout` | Revoke current token / logout |
| GET | `/user/profile` | `UserController@getProfile` | Current user profile |
| POST | `/user/update-profile` | `UserController@updateProfile` | Update profile (business rules in controller; may block certain users e.g. userID 1 on some subject endpoints elsewhere) |
| GET | `/subjects/all` | `SubjectController@allSubjects` | All subjects (controller may restrict specific users) |
| GET | `/practice-exam/results/{subjectID}` | `PracticeExamController@subjectExamResults` | Practice exam results for a subject |
| GET | `/results/all-students` | `PracticeExamController@getAllExamResults` | Aggregated exam results (all students / not subject-scoped per route comment) |
| GET | `/practice-exam/leaderboard/{subjectID}` | `PracticeExamLeaderboardController@leaderboard` | Subject leaderboard |
| GET | `/practice-exam/recent-takers/{subjectID}` | `PracticeExamLeaderboardController@recentTakers` | Recent takers for subject |
| GET | `/practice-exam/overall-leaderboard` | `PracticeExamLeaderboardController@overallLeaderboard` | Overall leaderboard |
| GET | `/practice-exam/overall-recent-takers` | `PracticeExamLeaderboardController@overallRecentTakers` | Overall recent takers |
| GET | `/classes/{classID}/quizzes` | `ClassPersonalQuizController@index` | Quizzes assigned to a class |
| GET | `/classes/index` | `ClassController@index` | List classes (semantics per controller) |

---

## 3. Faculty, Program Chair, Dean, Associate Dean

**Middleware:** `auth:sanctum`, `TokenExpirationMiddleware`, `role:2,3,4,5`.

### Users

| Method | Path | Controller action |
|--------|------|---------------------|
| GET | `/users` | `UserController@index` |
| PATCH | `/users/{userID}/approve` | `UserController@approveUser` |
| PATCH | `/users/{userID}/disapprove` | `UserController@disapproveUser` |
| POST | `/users/approve-multiple` | `UserController@approveMultipleUsers` |
| POST | `/users/activate-multiple` | `UserController@activateMultipleUsers` |
| POST | `/users/deactivate-multiple` | `UserController@deactivateMultipleUsers` |
| PATCH | `/users/{id}/deactivate` | `UserController@deactivate` |
| PATCH | `/users/{id}/activate` | `UserController@activate` |

### Choices (bank questions)

| Method | Path | Controller action |
|--------|------|---------------------|
| POST | `/questions/choices` | `ChoiceController@store` |
| GET | `/questions/{questionID}/choices` | `ChoiceController@showChoices` |
| POST | `/choices/update` | `ChoiceController@updateChoices` |

### Subjects & faculty assignment

| Method | Path | Controller action |
|--------|------|---------------------|
| GET | `/subjects` | `SubjectController@index` |
| POST | `/faculty/assign-subject` | `FacultySubjectController@assignSubject` |
| GET | `/faculty/my-subjects` | `FacultySubjectController@mySubjects` |
| GET | `/faculty/availableSubjects` | `FacultySubjectController@availableSubjects` |
| DELETE | `/remove-assigned-subject/{subjectID}` | `FacultySubjectController@removeAssignedSubject` |
| GET | `/subjects/{subjectID}/exam-questions-status` | `SubjectController@getExamQuestionsStatus` |

### Year levels & programs

| Method | Path | Controller action |
|--------|------|---------------------|
| GET | `/year-levels` | `YearLevelController@index` |
| GET | `/programs` | `ProgramController@index` |

### Questions (bank)

| Method | Path | Controller action |
|--------|------|---------------------|
| POST | `/questions/add` | `QuestionController@store` |
| GET | `/subjects/{subjectID}/questions` | `QuestionController@indexQuestions` |
| POST | `/questions/update/{questionID}` | `QuestionController@update` |
| DELETE | `/questions/delete/{questionID}` | `QuestionController@destroy` |
| GET | `/faculty/my-questions/{subjectID}` | `QuestionController@mySubjectQuestions` |
| POST | `/questions/{questionID}/duplicate` | `QuestionController@duplicate` |
| GET | `/questions/count` | `QuestionController@questionCount` |

### Printing & previews

| Method | Path | Controller action |
|--------|------|---------------------|
| POST | `/generate-printable-exam/{subjectID}` | `PrintController@generatePrintableExam` |
| GET | `/personal-quiz/{personalQuizID}/questions` | `PrintController@getPersonalQuizQuestions` |
| POST | `/generate-personal-quiz-pdf` | `PrintController@generatePersonalQuizPDF` |
| GET | `/practice-exam/preview/{subjectID}` | `PracticeExamController@previewPracticeExam` |
| POST | `/generate-single-subject-personal-preview` | `PrintController@generateSingleSubjectPersonalPreview` |

### Practice exam leaderboards (duplicated from “any role” group)

These paths are **also** registered here for roles 2–5 (alongside the authenticated-any-role group):

| Method | Path | Controller action |
|--------|------|---------------------|
| GET | `/practice-exam/leaderboard/{subjectID}` | `PracticeExamLeaderboardController@leaderboard` |
| GET | `/practice-exam/recent-takers/{subjectID}` | `PracticeExamLeaderboardController@recentTakers` |
| GET | `/practice-exam/overall-leaderboard` | `PracticeExamLeaderboardController@overallLeaderboard` |

*(Note: `overall-recent-takers` is not duplicated in this block.)*

### Personal quiz library

| Method | Path | Controller action |
|--------|------|---------------------|
| POST | `/personal-quizzes` | `PersonalQuizController@store` |
| GET | `/personal-quizzes` | `PersonalQuizController@index` |
| GET | `/personal-quizzes/archived` | `PersonalQuizController@archived` |
| PUT | `/update-personal-quizzes/{personalQuizID}` | `PersonalQuizController@update` |
| PATCH | `/personal-quizzes/{personalQuizID}/archive` | `PersonalQuizController@archive` |
| PATCH | `/personal-quizzes/{personalQuizID}/unarchive` | `PersonalQuizController@unarchive` |
| DELETE | `/personal-quizzes/{personalQuizID}` | `PersonalQuizController@destroy` |
| GET | `/personal-quiz/{personalQuizID}/leaderboard` | `PersonalQuizLeaderboardController@leaderboard` |
| GET | `/personal-quiz/{personalQuizID}/recent-takers` | `PersonalQuizLeaderboardController@recentTakers` |

### Personal quiz questions & choices

| Method | Path | Controller action |
|--------|------|---------------------|
| GET | `/personal-quiz-questions/{personalQuizID}` | `PersonalQuizQuestionController@index` |
| POST | `/personal-quiz-questions` | `PersonalQuizQuestionController@store` |
| POST | `/personal-quiz-questions/import` | `PersonalQuizQuestionController@import` |
| POST | `/personal-quiz-questions/{personalQuizQuestionID}` | `PersonalQuizQuestionController@update` |
| POST | `/personal-quiz-questions/{personalQuizQuestionID}/duplicate` | `PersonalQuizQuestionController@duplicate` |
| DELETE | `/personal-quiz-questions/{personalQuizQuestionID}` | `PersonalQuizQuestionController@destroy` |
| GET | `/personal-quiz-choices/{personalQuizQuestionID}` | `PersonalQuizChoiceController@show` |
| POST | `/personal-quiz-choices` | `PersonalQuizChoiceController@store` |
| PUT | `/personal-quiz-choices` | `PersonalQuizChoiceController@updateChoices` |
| POST | `/personal-quiz-choices/update` | `PersonalQuizChoiceController@updateChoices` (alias) |
| DELETE | `/personal-quiz-choices/{personalQuizChoiceID}` | `PersonalQuizChoiceController@destroy` |

### Class quiz settings (per class–quiz assignment)

| Method | Path | Controller action |
|--------|------|---------------------|
| GET | `/class-quizzes/{classPersonalQuizID}/settings` | `PersonalQuizSettingController@show` |
| POST | `/class-quizzes/{classPersonalQuizID}/settings` | `PersonalQuizSettingController@store` |
| PUT | `/class-quizzes/{classPersonalQuizID}/settings` | `PersonalQuizSettingController@update` |
| DELETE | `/class-quizzes/{classPersonalQuizID}/settings` | `PersonalQuizSettingController@destroy` |

### Personal exam settings (reuses practice exam setting controller)

| Method | Path | Controller action |
|--------|------|---------------------|
| POST | `/personal-exam-settings` | `PracticeExamSettingController@store` |
| GET | `/personal-exam-settings/{subjectID}` | `PracticeExamSettingController@show` |

### Teacher–student enrollment (faculty view)

| Method | Path | Controller action |
|--------|------|---------------------|
| GET | `/my-students` | `StudentTeacherEnrollmentController@myStudents` |

### Personal classes

| Method | Path | Controller action |
|--------|------|---------------------|
| POST | `/classes` | `ClassController@store` |
| GET | `/classes/archived` | `ClassController@archived` |
| GET | `/classes/show/{classID}` | `ClassController@show` |
| PUT | `/classes/update/{classID}` | `ClassController@update` |
| PATCH | `/classes/archive/{classID}` | `ClassController@archive` |
| PATCH | `/classes/{classID}/unarchive` | `ClassController@unarchive` |
| DELETE | `/classes/destroy/{classID}` | `ClassController@destroy` |

### Class enrollments (faculty)

| Method | Path | Controller action |
|--------|------|---------------------|
| GET | `/classes/{classID}/students` | `ClassEnrollmentController@index` |
| DELETE | `/classes/{classID}/remove-student` | `ClassEnrollmentController@removeStudent` |

### Class personal quizzes (faculty)

| Method | Path | Controller action |
|--------|------|---------------------|
| GET | `/classes/{classID}/quizzes/available` | `ClassPersonalQuizController@availablePersonalQuizzes` |
| POST | `/classes/quizzes` | `ClassPersonalQuizController@store` |
| PUT | `/classes/quizzes/{classPersonalQuizID}` | `ClassPersonalQuizController@update` |
| PATCH | `/classes/quizzes/{classPersonalQuizID}/dates` | `ClassPersonalQuizController@updateDates` |
| DELETE | `/classes/quizzes/{classPersonalQuizID}` | `ClassPersonalQuizController@destroy` |
| GET | `/personal-quizzes/{personalQuizID}/classes` | `ClassPersonalQuizController@getClassesForQuiz` |
| POST | `/personal-quizzes/{personalQuizID}/assign-classes` | `ClassPersonalQuizController@assignQuizToClasses` |

### Quiz results & analytics (faculty)

| Method | Path | Controller action |
|--------|------|---------------------|
| GET | `/quiz-results` | `StudentQuizResultController@index` |
| GET | `/quiz-results/{id}` | `StudentQuizResultController@show` |
| PUT | `/quiz-results/{id}` | `StudentQuizResultController@update` |
| DELETE | `/quiz-results/{id}` | `StudentQuizResultController@destroy` |
| GET | `/classes/{classID}/quiz-results` | `StudentQuizResultController@classResults` |
| GET | `/quizzes/{classPersonalQuizID}/results` | `StudentQuizResultController@quizResults` |
| GET | `/quizzes/{classPersonalQuizID}/non-takers` | `StudentQuizResultController@quizNonTakers` |

### Quiz sessions (faculty)

| Method | Path | Controller action |
|--------|------|---------------------|
| GET | `/quiz-sessions/faculty-sessions` | `QuizSessionController@facultySessions` |

---

## 4. Student only (`role:1`)

**Middleware:** `api`, `auth:sanctum`, `role:1`.

| Method | Path | Controller action | Description |
|--------|------|-------------------|-------------|
| GET | `/student/practice-subjects` | `SubjectController@getProgramSubjects` | Subjects for student’s program |
| GET | `/practice-exam/generate/{subjectID}` | `PracticeExamController@generate` | Generate practice exam |
| POST | `/practice-exam/submit` | `PracticeExamController@submit` | Submit practice exam |
| GET | `/practice-exam/history` | `PracticeExamController@history` | Practice exam history |
| POST | `/enroll-teacher` | `StudentTeacherEnrollmentController@enroll` | Enroll under a teacher |
| GET | `/my-teachers` | `StudentTeacherEnrollmentController@myTeachers` | List enrolled teachers |
| POST | `/personal-exam/generate/{subjectID}/{teacherID}` | `PracticeExamController@generatePersonalExam` | Personal exam for teacher |
| POST | `/personal-exam/submit` | `PracticeExamController@submitPersonalExam` | Submit personal exam |
| GET | `/classes/my-classes` | `ClassEnrollmentController@myClasses` | Student’s classes |
| POST | `/classes/join-by-code` | `ClassEnrollmentController@joinByCode` | Join class by code |
| GET | `/classes/join/{token}` | `ClassEnrollmentController@joinByLink` | Join class by invite token |
| DELETE | `/classes/{classID}/unenroll` | `ClassEnrollmentController@unenroll` | Leave class |
| GET | `/classes/{classID}/quizzes/student` | `ClassPersonalQuizController@studentQuizzes` | Quizzes visible to student |
| GET | `/quizzes/{classPersonalQuizID}/info` | `StudentQuizController@getQuizInfo` | Quiz metadata / rules |
| POST | `/quizzes/{classPersonalQuizID}/start` | `StudentQuizController@startQuiz` | Start attempt |
| POST | `/quizzes/{classPersonalQuizID}/submit` | `StudentQuizController@submitQuiz` | Submit attempt |
| GET | `/quiz-results` | `StudentQuizResultController@index` | Own results (see duplicate-route note) |
| GET | `/quiz-results/{id}` | `StudentQuizResultController@show` | Own result detail (see duplicate-route note) |
| GET | `/classes/{classID}/quiz-history` | `StudentQuizResultController@classHistory` | History for class |
| GET | `/quizzes/{classPersonalQuizID}/history` | `StudentQuizResultController@quizHistory` | History for quiz |
| GET | `/quiz-sessions` | `QuizSessionController@studentSessions` | Student quiz sessions |

---

## 5. Program Chair only (`role:3`)

**Middleware:** `auth:sanctum`, `role:3`.

| Method | Path | Controller action |
|--------|------|---------------------|
| GET | `/program/{subjectID}` | `QuestionController@indexQuestionsByProgram` |

---

## 6. Program Chair, Dean, Associate Dean (`role:3,4,5`)

**Middleware:** `auth:sanctum`, `role:3,4,5`.

| Method | Path | Controller action |
|--------|------|---------------------|
| PATCH | `/questions/{questionID}/status` | `QuestionController@updateStatus` |
| GET | `/practice-settings/{subjectID}` | `PracticeExamSettingController@show` |
| POST | `/practice-settings` | `PracticeExamSettingController@store` |
| POST | `/generate-multi-subject-exam` | `PrintController@generateMultiSubjectExam` |
| PATCH | `/users/{userID}/role` | `UserController@changeUserRole` |

---

## 7. Dean & Associate Dean only (`role:4,5`)

**Middleware:** `auth:sanctum`, `role:4,5`.

| Method | Path | Controller action |
|--------|------|---------------------|
| POST | `/add-subjects` | `SubjectController@store` |
| DELETE | `/subjects/{subjectID}/delete` | `SubjectController@destroy` |
| PUT | `/subjects/{subjectID}/update` | `SubjectController@update` |
| DELETE | `/users/{userID}` | `UserController@deleteUser` |
| POST | `/users/delete-multiple` | `UserController@deleteMultipleUsers` |
| PATCH | `/subjects/{subjectID}/enable-exam-questions` | `SubjectController@enableExamQuestions` |
| PATCH | `/subjects/{subjectID}/disable-exam-questions` | `SubjectController@disableExamQuestions` |

---

## 8. Static files (CORS-enabled)

No Bearer token required unless you add global middleware. These routes live on the same API route file; confirm whether your reverse proxy maps them under `/api` or only at application root (Laravel default attaches `api` routes with the API prefix—so these are typically `/api/storage/...`).

| Method | Path | Behavior |
|--------|------|----------|
| GET | `/storage/question_images/{filename}` | Streams file from `public/storage/question_images/` or **404** |
| GET | `/storage/choices/{filename}` | Streams file from `public/storage/choices/` or **404** |

**Middleware:** `image.cors` (custom CORS headers for client-side PDF/image use).

---

## Request/response schemas

This reference does not duplicate every validation rule and JSON shape. For exact payloads and fields, see the corresponding controller methods under `Modules/**/Controllers` and any `FormRequest` classes in `app/Http/Requests`.

---

## Machine-readable spec

An **OpenAPI 3** description of paths and security is maintained alongside this file: `docs/openapi.yaml`. Import it into Postman, Insomnia, or Swagger UI for interactive exploration.

---

*Generated from `routes/api.php`. Maintain this document when routes change.*
