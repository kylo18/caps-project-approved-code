# Bug: Google Auth Fails for existing CAPS Users before google authentication functionality 

## Context
Google Auth only works for accounts created/approved **after** the feature was added. Users with pre-existing CAPS accounts get a generic `"Login Failed. Failed to authenticate with Google."` instead of a specific error. Per the docs, that generic message is the fallback for `provider_failed` — not one of the specific cases (`no_account`, `account_pending`, `account_not_approved`, `account_inactive`). This means the request is likely erroring out partway through the backend flow instead of being deliberately rejected.

## Where to look
`Backend - Deployment/Modules/Users/Controllers/SocialAuthController.php`

This is where the whole Google callback is handled — user lookup, auto-linking, status checks, and token creation (flow steps 7–12 in the feature doc). Since legacy users have no `google_id` yet, they always go through the **email lookup → auto-link** path (step 8–9), making this the most likely spot for the failure.

Also worth checking:
- `Modules/Users/Database/Migrations/2026_03_27_000001_add_google_id_to_users_table.php` — how `google_id` was added to existing rows (defaults/constraints could affect old records differently than new ones).
- `Modules/Users/Models/User.php` — confirm `google_id` is fillable and legacy rows don't fail model-level validation.

