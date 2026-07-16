# Bug: Google Auth Fails for Existing (Legacy) CAPS Users

**Date fixed:** 2026-07-15
**Component:** `Modules/Users/Controllers/SocialAuthController.php` (Google/Facebook OAuth callback)
**Severity:** Blocks login for all pre-feature ("legacy") approved accounts via Google.

---

## Symptom

Google Auth only worked for accounts created/approved **after** the social-auth feature was
added. Users with pre-existing CAPS accounts were rejected. On the frontend this appeared as a
generic **"Login Failed"** screen, which made it look like a provider/exception failure
(`provider_failed`).

## Root Cause

The failure was **not** an exception or a `provider_failed` fallback. It was a deliberate,
specific rejection caused by a **status allow-list mismatch**.

The `statuses` table is shared by users and questions and contains two different "good" statuses
for users, from two eras of the app:

| id | name         | meaning                                         |
|----|--------------|-------------------------------------------------|
| 1  | `pending`    | awaiting approval                               |
| 2  | `approved`   | **legacy** good-status (pre-social-auth)        |
| 4  | `registered` | **current** good-status (assigned on approval)  |

The current approval flow (`UserController.php`) assigns **`registered` (4)** when an admin
approves someone — even though the notification email says "approved". So:

- Users approved **after** the feature → status `registered` (4) → **worked**.
- Users approved **before** the feature → still status `approved` (2) → **rejected**.

The Google auto-link gate accepted **only** `registered`:

```php
// SocialAuthController@handleOAuthUser  (the buggy line)
if ($user->status_id !== $registeredStatusId) {   // 2 !== 4  → TRUE for legacy users
    return $this->redirectToFrontendError('account_not_approved', ...);
}
```

Legacy users therefore hit `account_not_approved`. The Laravel log confirmed it:

```
local.WARNING: Social login blocked: Account not approved.
  {"provider":"google","userID":821,"email":"carlossabijon04@gmail.com"}
```

### Why it looked "generic"
The web callback (`Frontend - Deployment_Web/src/pages/GoogleAuthCallback.jsx`) renders a fixed
**"Login Failed"** heading with the backend message underneath, so the specific
`account_not_approved` message was easy to mistake for the generic provider failure.

### Red herrings ruled out
- **`google_id` unique constraint** — the `2026_03_27_..._add_google_id_to_users_table` migration's
  `->unique()` block is **skipped** because `google_id` already existed from
  `2026_03_13_..._add_social_columns_to_users_table`. So there is no unique index and no
  insert/update conflict. Legacy rows are plain `NULL`.
- **`google_id` fillability** — it **is** in `$fillable` on `User.php`, so the auto-link
  `update()` succeeds.
- Neither the migration nor the model was the cause; the status gate was.

### Note on the inconsistency
The gate's own comment claims it *"mirrors the same checks used in AuthController@login"* — but
`AuthController@login` only blocks `pending` + inactive; it never requires `registered`. That's why
a legacy `approved` user could log in with a **password** but was rejected via **Google**.

---

## The Fix

Two complementary parts.

### 1. Code fix — accept both good-statuses

`Modules/Users/Controllers/SocialAuthController.php`, in `handleOAuthUser()`:

```php
$pendingStatusId    = \DB::table('statuses')->where('name', 'pending')->first()->id ?? null;
$registeredStatusId = \DB::table('statuses')->where('name', 'registered')->first()->id ?? null;
// Legacy accounts approved before the social-auth feature carry the old
// "approved" status instead of "registered". Treat both as valid good-statuses.
$approvedStatusId   = \DB::table('statuses')->where('name', 'approved')->first()->id ?? null;
$validStatusIds     = array_filter([$registeredStatusId, $approvedStatusId]);

// ... pending check unchanged ...

if (!in_array($user->status_id, $validStatusIds, true)) {   // was: !== $registeredStatusId
    return $this->redirectToFrontendError('account_not_approved', ...);
}
```

This is a safety net so any future legacy row (e.g. a backup restore) still works.

### 2. Data migration — converge users on the current good-status

`Modules/Users/Database/Migrations/2026_07_15_000000_migrate_legacy_approved_users_to_registered.php`

Moves **user** rows on legacy `approved` (2) → `registered` (4), by name lookup, idempotent.
The shared `approved` status row is left in place because **questions still use `status_id = 2`**
(verified in `FacultySubjectController`, `QuestionController`, `AdminAnalyticsController` — those
query the `questions` table, not `users`). `down()` is intentionally a no-op (irreversible: once
merged, migrated rows are indistinguishable from originally-registered ones).

---

## Verification

- `php -l` clean on host and inside the container.
- DB before → after: `approved 6 → 0`, `registered 13 → 19`. userID 821 now `registered`.
- Backend image rebuilt (`docker compose build backend`) and container recreated
  (`docker compose up -d backend`). The entrypoint's `php artisan migrate` ran the new migration
  on boot (`DONE`, idempotent).
- Smoke test: `GET /api/auth/google/redirect` returns `302` to Google's OAuth endpoint.

## Affected / Applied Locations

- Code + migration applied to **both** working copies: `CAPS/JuniorRedeployed/` and
  `CAPS/Caps_Junior/` (byte-identical trees) to keep future deploys consistent.
- Live environment redeployed: `redeployed_backend` container (image `juniorredeployed-backend`).

## Redeploy / Reproduce Steps

```bash
cd "/home/ubuntu/CAPS/JuniorRedeployed"
docker compose build backend
docker compose up -d backend
# entrypoint runs `php artisan migrate` automatically on boot
```

## Future Guidance

- Treat **`registered` (4)** as the single canonical "good" user status going forward. `approved`
  (2) is legacy for users but **still meaningful for questions** — do not delete or repurpose it.
- When adding status gates for users, prefer **blocking bad states** (pending / inactive), the way
  `AuthController@login` does, rather than allow-listing one exact "good" id — that pattern is what
  stranded legacy accounts here.
