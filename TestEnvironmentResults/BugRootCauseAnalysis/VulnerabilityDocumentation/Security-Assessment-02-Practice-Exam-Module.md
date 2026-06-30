# Security Assessment Report
## Practice Exam Module — CAPS (Comprehensive Assessment and Preparation System)

**Target:** Practice Exam Module — PHP Laravel 12 REST API + React SPA (Sanctum auth, MySQL)
**Assessment date:** 2026-06-23
**Branch reviewed:** `VulnerabilityPatch`
**Assessor role:** Senior Cybersecurity Analyst / EdTech Security Consultant
**Primary components:** `Modules/PracticeExams/`, `routes/api.php`, `src/pages/PracticeExam.jsx`, `src/pages/PracticeExamInfo.jsx`
**Note:** Findings already covered in *Security Assessment 01 (Sensitive Data & Token Exposure)* — `APP_DEBUG=true`, `'error' => $e->getMessage()` leakage, `sessionStorage` token storage, permissive CORS — are **not** re-reported here. They compound several findings below and are cross-referenced where relevant.

---

## A. Executive Summary

The Practice Exam Module dynamically assembles randomized exams from an encrypted question bank using server-side settings (coverage, item count, difficulty split, timer), lets students take them, and scores submissions on the server. The **mechanical design has good bones** — questions are encrypted at rest, scoring is performed server-side, exam parameters come from server-side settings (not the client), and subject access is scoped to the student's program.

**However, the module fails at its single most important security objective: exam integrity and fairness.** Two independent CRITICAL flaws each, on their own, let a student obtain a perfect score:

1. **The correct answer for every question is shipped to the browser** in the exam-generation response (and then cached in `localStorage`). The code that hides the answer key for faculty *preview* was never applied to the student exam.
2. **The score's denominator and question set are entirely attacker-controlled at submission.** The server scores whatever question/answer pairs the client sends, with no binding to the exam it generated — so submitting a single known-correct answer yields 100%.

These are compounded by **no server-side timer enforcement**, **IDOR on results endpoints** (any student can read every student's scores and names), and **no rate-limiting or duplicate-submission control** (leaderboard farming / scripted submissions).

### Overall Risk Rating: **CRITICAL** (for the module's integrity & fairness objective)

The confidentiality of the question bank's *answer keys* is broken, the integrity of scores is broken, and the fairness guarantees the system exists to provide can be defeated by a student with only browser developer tools — no special skills required.

### Findings at a glance

| ID | Vulnerability | Severity | OWASP API / Top 10 |
|----|---------------|----------|--------------------|
| PE-1 | Correct answers (`isCorrect`) exposed in exam-generation response + `localStorage` | **Critical** | API3 / A01, A04 |
| PE-2 | Score denominator & question set attacker-controlled at submission (trivial 100%) | **Critical** | API6 / A04, A08 |
| PE-3 | No server-side timer enforcement (client-only countdown) | **High** | A04 |
| PE-4 | Broken authorization / IDOR on results endpoints — cross-student scores & PII | **High** | API1, API5 / A01 |
| PE-5 | Unlimited duplicate submissions; no rate limiting (farming, replay, automation) | **High** | API4 / A04 |
| PE-6 | No binding between generated exam and submission (request tampering / question injection) | **Medium** | API3 / A08 |
| PE-7 | Personal-exam authorization built on a non-existent property (`$user->id`) — fragile/accidental control | **Medium** | A04 |

### Verified positives (not findings)
- **Scoring is server-side** — the client submits answers, not a score (`submit()` recomputes). ✔
- **Result rows are bound to the authenticated user** (`'userID' => $user->userID`, explicit array — no mass-assignment of another user's ID). ✔
- **Question text & choices are encrypted at rest** (`Crypt::decryptString`). ✔
- **Exam parameters are server-driven** — coverage/item-count/difficulty/timer come from `PracticeExamSetting`; the settings endpoints are gated to roles 3/4/5, so **students cannot tamper with exam parameters**. ✔
- **Generation scopes subjects** to the student's `programID` or general subjects (`programID = 6`), excludes `pending` questions, and honors `isEnabled`. ✔
- The faculty preview path **correctly strips `isCorrect`** — proving the team knows the pattern, which makes PE-1 a clear, fixable oversight. ✔

---

## B. Vulnerability Findings

### PE-1 — Answer key disclosed to the client *(CRITICAL)*
**Description.** `formatChoice()` includes `'isCorrect' => $choice->isCorrect` for every choice ([PracticeExamController.php:471-477](../Backend%20-%20Deployment/Modules/PracticeExams/Controllers/PracticeExamController.php#L471-L477)). The student-facing `generate()` ([:208-214](../Backend%20-%20Deployment/Modules/PracticeExams/Controllers/PracticeExamController.php#L208-L214)) and `generatePersonalExam()` ([:412-418](../Backend%20-%20Deployment/Modules/PracticeExams/Controllers/PracticeExamController.php#L412-L418)) push these choices **without removing `isCorrect`**. The frontend then writes the entire question set — answer key included — into `localStorage` (`${examKey}_exam_data`, `${examKey}_questions`; [PracticeExam.jsx:438-510](../Frontend%20-%20Deployment/src/pages/PracticeExam.jsx#L438-L510)). Tellingly, the faculty `previewPracticeExam()` explicitly calls `unset($formatted['isCorrect'])` ([:606-607, 627-628](../Backend%20-%20Deployment/Modules/PracticeExams/Controllers/PracticeExamController.php#L606-L607)) — the protection exists for preview but was never applied to the real student exam.
**Severity:** Critical. **Impact:** Any student can open DevTools → Network (or read `localStorage`) and see the correct answer for every item **before answering** — a complete defeat of assessment validity and fairness. **Affected component:** `generate`, `generatePersonalExam`, `formatChoice`; `PracticeExam.jsx` storage. **Root cause:** The internal grading field `isCorrect` is serialized into the student delivery payload; no separation between "exam to take" and "answer key."

### PE-2 — Attacker-controlled score at submission *(CRITICAL)*
**Description.** `submit()` ([:685-744](../Backend%20-%20Deployment/Modules/PracticeExams/Controllers/PracticeExamController.php#L685-L744)) computes `totalPoints` and `earnedPoints` by iterating **only over the answers the client submitted**, then `percentage = earnedPoints / totalPoints * 100`. It never checks that the submitted questions correspond to a generated exam, match the subject's configured `total_items`, or even belong to the subject. Both the numerator *and the denominator* are derived from client input.
**Severity:** Critical. **Impact:** A student can submit a single question they know is correct (trivially, via PE-1) and receive **100%**; or submit only the subset they're sure of. Scores and leaderboard standings become meaningless. **Affected component:** `submit`, `submitPersonalExam` ([:749-822](../Backend%20-%20Deployment/Modules/PracticeExams/Controllers/PracticeExamController.php#L749-L822)). **Root cause:** Stateless submission with no server-authoritative exam session; the server trusts the client to send the full, correct question set.

### PE-3 — No server-side timer enforcement *(HIGH)*
**Description.** `generate()` returns `enableTimer` and `durationMinutes`, but the countdown runs entirely client-side via `setInterval`, persisted to `localStorage` (`${examKey}_timer`; [PracticeExam.jsx:494-535](../Frontend%20-%20Deployment/src/pages/PracticeExam.jsx#L494-L535)). No exam start time is stored server-side, and `submit()` performs **no time validation**.
**Severity:** High. **Impact:** A student can take unlimited time, edit/freeze the `localStorage` timer value, or submit long after the nominal duration — the server cannot tell. **Affected component:** `generate` (emits duration), `submit` (no check); `PracticeExam.jsx` timer. **Root cause:** Time limit enforced on the client; no server-side session/clock.

### PE-4 — Broken authorization / IDOR on results endpoints *(HIGH)*
**Description.** Two result endpoints sit in the **base `auth:sanctum` group** (any authenticated user, including students) and perform **no ownership or role checks**:
- `subjectExamResults($subjectID)` ([:861-893](../Backend%20-%20Deployment/Modules/PracticeExams/Controllers/PracticeExamController.php#L861-L893), route [api.php:61](../Backend%20-%20Deployment/routes/api.php#L61)) returns **every** student's name, program, and scores for a subject.
- `getAllExamResults()` ([:898-915](../Backend%20-%20Deployment/Modules/PracticeExams/Controllers/PracticeExamController.php#L898-L915), route [api.php:64](../Backend%20-%20Deployment/routes/api.php#L64)) returns `PracticeExamResult::all()` — **all results for all students**, as raw models.

The leaderboard endpoints ([:920-944](../Backend%20-%20Deployment/Modules/PracticeExams/Controllers/PracticeExamController.php#L920-L944), [api.php:67-70](../Backend%20-%20Deployment/routes/api.php#L67-L70)) similarly expose all takers' names/programs (partly by design for a leaderboard, but still PII).
**Severity:** High. **Impact:** A student iterates `subjectID = 1,2,3,…` (or calls `/results/all-students`) to harvest the entire cohort's identities and performance — a privacy breach and IDOR. **Affected component:** `subjectExamResults`, `getAllExamResults`, `leaderboard`; route grouping. **Root cause:** Missing function-/object-level authorization; reliance on an over-permissive route group.

### PE-5 — Unlimited duplicate submissions; no rate limiting *(HIGH)*
**Description.** `submit()` unconditionally inserts a new `PracticeExamResult` every call. There is no idempotency key, no per-attempt session, no duplicate detection, and **no `throttle` middleware** on any practice-exam route ([api.php:230-273](../Backend%20-%20Deployment/routes/api.php#L230-L273)).
**Severity:** High. **Impact:** Combined with PE-1/PE-2, a student can script thousands of perfect submissions to dominate the subject/overall leaderboards, or replay a previously captured submission request. Also enables resource-exhaustion abuse. **Affected component:** `submit`, `submitPersonalExam`; routing. **Root cause:** No submission/attempt controls; no rate limiting.

### PE-6 — No binding between generated exam and submission *(MEDIUM)*
**Description.** Because no server-side record ties a submission to the exam that was generated, a crafted `POST /api/practice-exam/submit` can include arbitrary `questionID`/`selectedChoiceID` pairs — including questions from other subjects/coverages — and the server will grade and persist them under the student's account ([:705-723](../Backend%20-%20Deployment/Modules/PracticeExams/Controllers/PracticeExamController.php#L705-L723)). The only validation is `exists:` rules on IDs.
**Severity:** Medium (an enabler/variant of PE-2, separated for tampering clarity). **Impact:** Request tampering / question injection; results that never corresponded to a real exam delivery. **Root cause:** Stateless, unsigned submission payload.

### PE-7 — Personal-exam authorization on a non-existent property *(MEDIUM)*
**Description.** The enrollment gate uses `$user->id` ([:259](../Backend%20-%20Deployment/Modules/PracticeExams/Controllers/PracticeExamController.php#L259), [:766](../Backend%20-%20Deployment/Modules/PracticeExams/Controllers/PracticeExamController.php#L766)) and stores `'student_id' => $user->id` ([:805](../Backend%20-%20Deployment/Modules/PracticeExams/Controllers/PracticeExamController.php#L805)), but the `User` model's primary key is `userID` (`Modules/Users/Models/User.php:35`) and there is no `id` column — so `$user->id` is `null`. The check `where('student_id', null)->exists()` is "accidentally" fail-closed, and any stored `student_id` would be null.
**Severity:** Medium. **Impact:** The personal-exam authorization control does not actually evaluate enrollment; it works only by accident (deny) and would mis-store records. A future refactor that makes `$user->id` resolve (e.g., adding an `id` accessor) could silently open the path. **Affected component:** `generatePersonalExam`, `submitPersonalExam`. **Root cause:** Incorrect identifier; authorization built on a fragile assumption rather than an explicit, tested relationship.

---

## C. Attack Scenarios

**Scenario 1 — "Open-book in plain sight" (PE-1).** A student starts a practice exam, opens DevTools → Network, selects the `generate` response, and reads `choices[].isCorrect` for each question. (Equivalently: `JSON.parse(localStorage.getItem('exam_<subject>_exam_data'))`.) They answer everything correctly.

**Scenario 2 — "Perfect score in one request" (PE-2 + PE-6).** Skipping the UI entirely, the student sends:
```http
POST /api/practice-exam/submit
Authorization: Bearer <their token>
{ "subjectID": 7, "answers": [ { "questionID": 1234, "selectedChoiceID": 5678 } ] }
```
where `5678` is a choice they know is correct. The server scores 1/1 → **100%** and stores it.

**Scenario 3 — "Beat the clock" (PE-3).** The student sets `localStorage['exam_<subject>_timer']` to a large value (or deletes it / disables JS), takes as long as they want, and submits — the server never checks elapsed time.

**Scenario 4 — "Harvest the cohort" (PE-4).** Any logged-in student calls `GET /api/results/all-students` or iterates `GET /api/practice-exam/results/{subjectID}` and exfiltrates every student's name, program, and scores.

**Scenario 5 — "Leaderboard bot" (PE-5 + PE-2).** A short script loops the submit request from Scenario 2 hundreds of times; with no throttle or dedup, the attacker pins the top of the subject and overall leaderboards.

**Scenario 6 — "Replay" (PE-5/PE-6).** A previously captured valid submit request is re-sent unchanged (token still within its 3-hour life); it is accepted and recorded again.

---

## D. OWASP Mapping

**OWASP API Security Top 10 (2023)**
- **API1 Broken Object Level Authorization** — PE-4 (cross-student results via `subjectID`).
- **API3 Broken Object Property Level Authorization** — PE-1 (over-exposed `isCorrect`), PE-6.
- **API4 Unrestricted Resource Consumption** — PE-5 (no rate limiting / dedup).
- **API5 Broken Function Level Authorization** — PE-4 (`getAllExamResults` reachable by students).
- **API6 Unrestricted Access to Sensitive Business Flows** — PE-2 (the exam-submission flow can be automated for guaranteed perfect scores).

**OWASP Top 10 (2021)**
- **A01 Broken Access Control** — PE-1, PE-4.
- **A04 Insecure Design** — PE-2, PE-3, PE-5, PE-7 (missing exam-session abstraction, server clock, attempt limits).
- **A08 Software & Data Integrity Failures** — PE-2, PE-6 (client-trusted, unsigned submission integrity).
- *(A05 Security Misconfiguration & verbose errors — see Assessment 01.)*

---

## E. Recommendations (Laravel-specific)

**1. Stop shipping the answer key (PE-1).**
Drive student delivery through a dedicated API Resource that omits `isCorrect`:
```php
// app/Http/Resources/ExamChoiceResource.php
public function toArray($request): array {
    return [
        'choiceID'    => $this->choiceID,
        'choiceText'  => $this->choiceText,
        'choiceImage' => $this->choiceImage,
        'position'    => $this->position,
        // isCorrect intentionally omitted
    ];
}
```
Have `formatChoice()` never include `isCorrect` for student-facing flows (mirror what `previewPracticeExam` already does), and keep correctness strictly server-side.

**2. Make exams stateful and submission server-authoritative (PE-2, PE-3, PE-6).**
Persist a server-side exam session at generation time — there is already a `practice_exam_drafts` migration to build on:
```php
$attempt = PracticeExamAttempt::create([
    'userID'      => $user->userID,
    'subjectID'   => $subjectID,
    'question_ids'=> $selectedQuestionIDs,   // the authoritative set + order
    'total_items' => $settings->total_items,
    'started_at'  => now(),
    'expires_at'  => $settings->enableTimer ? now()->addMinutes($settings->duration_minutes) : null,
]);
return ['attemptId' => $attempt->id, 'questions' => ExamQuestionResource::collection($q), ...];
```
At submission, grade **only** the attempt's questions and enforce the clock and denominator server-side:
```php
$attempt = PracticeExamAttempt::where('userID', $user->userID)->findOrFail($request->attemptId);
abort_if($attempt->submitted_at, 409, 'Already submitted');                 // dedup (PE-5)
abort_if($attempt->expires_at && now()->gt($attempt->expires_at), 422, 'Time expired'); // timer (PE-3)
$totalPoints = Question::whereIn('questionID', $attempt->question_ids)->sum('score'); // server denominator (PE-2)
// score only questions in $attempt->question_ids; ignore anything else the client sends (PE-6)
$attempt->update(['submitted_at' => now()]);
```

**3. Enforce authorization with Policies/Gates, not route groups alone (PE-4).**
```php
// PracticeExamResultPolicy
public function viewAny(User $u): bool { return in_array($u->roleID, [2,3,4,5]); } // faculty+
public function view(User $u, PracticeExamResult $r): bool {
    return $u->userID === $r->userID || in_array($u->roleID, [2,3,4,5]);
}
```
In controllers: `$this->authorize('viewAny', PracticeExamResult::class);`. Move `subjectExamResults` and `getAllExamResults` out of the base `auth:sanctum` group into a faculty-scoped group, scope faculty queries to their campus/program, and return data through a `ResultResource` (omit raw PKs; expose student identity only to authorized roles).

**4. Rate-limit and de-duplicate (PE-5).**
```php
Route::post('/practice-exam/submit', [PracticeExamController::class,'submit'])
    ->middleware('throttle:10,1');   // 10/min
```
Combine with the one-shot `attemptId` (recommendation 2) so a generated exam can be submitted exactly once. Consider a per-subject attempt cap/cooldown for leaderboard fairness.

**5. Sign / bind the submission payload (PE-6).** With a stateful `attemptId`, the question set is server-known and the client list is ignored — no need to trust client questionIDs. If a stateless design is ever required, sign the issued set (e.g. an HMAC over the question IDs + userID + nonce) and verify on submit.

**6. Fix the identity defect and add tests (PE-7).** Replace `$user->id` with `$user->userID` throughout the personal-exam flow, and add feature tests asserting that (a) a non-enrolled student is denied, and (b) an enrolled student's `student_id` is stored correctly. Prefer relationship existence checks (`$user->enrolledTeachers()->whereKey($teacherID)->exists()`) over manual column comparisons.

**7. Protect question images/attachments.** The image-serving routes ([api.php:327-341](../Backend%20-%20Deployment/routes/api.php#L327-L341)) read directly from `public/storage` with no auth. Serve exam images through an authenticated, attempt-scoped controller (or signed temporary URLs) so question media cannot be enumerated outside an exam.

---

## F. Remediation Plan

**Immediate (0–72 h) — restore exam integrity**
1. **PE-1:** strip `isCorrect` from all student-facing generation responses (apply the preview's `unset`, or switch to `ExamChoiceResource`). Ship today.
2. **PE-2 (interim):** in `submit()`, compute the denominator from the subject's configured `total_items`/question bank rather than the submitted array, and reject submissions whose question set doesn't match the subject — pending the full attempt model.
3. **PE-4:** add `authorize()`/role checks to `subjectExamResults` and `getAllExamResults`; move them out of the base auth group.
4. **PE-5:** add `throttle:10,1` to submit/generate routes.

**Short-term (1–3 weeks) — make exams stateful**
5. Implement the server-side **exam attempt/session** (recommendation 2) on top of the existing `practice_exam_drafts` table: authoritative question set, `started_at`/`expires_at`, one-shot submission. This closes PE-2, PE-3, PE-5 (dedup), and PE-6 together.
6. Introduce **API Resources** for questions, choices, and results; remove raw-model returns (`getAllExamResults`).
7. Fix **PE-7** (`$user->id` → `$user->userID`) and add enrollment tests.

**Long-term (1–3 months) — durable assessment integrity**
8. Add **Policies/Gates** for every exam object and a CI test suite covering IDOR, timer expiry, duplicate submission, and answer-key non-exposure (regression guard for PE-1).
9. Add **authenticated, attempt-scoped media delivery** (signed URLs) for question images.
10. Add **integrity telemetry**: server-side detection of impossible scores/timings (e.g., perfect score in < N seconds, more attempts than allowed) feeding faculty review.
11. Adopt secure-SDLC gates so new exam endpoints must pass authorization and resource-shaping checks before merge.

---

### Methodology note
All findings are white-box and evidence-backed with `file:line` references against the `VulnerabilityPatch` branch. I distinguished genuine flaws from non-issues: scoring **is** server-side, results are bound to the authenticated user, questions are encrypted at rest, and exam *parameters* are server-driven and not client-tamperable — so those were recorded as positives rather than findings. The decisive failures are answer-key disclosure (PE-1) and the absence of a server-authoritative exam session (PE-2/PE-3/PE-6), which together let a student guarantee a perfect score with nothing more than a browser.
