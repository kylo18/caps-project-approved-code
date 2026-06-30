# Rollback Guide — Environments/Test (v2.2) Merge

**Date of merge:** 2026-06-29
**Branch merged into:** `Environment/Prod`
**Branch merged from:** `origin/Environments/Test`

## Commit anchors

| Role | Commit | Description |
|------|--------|-------------|
| **Pre-merge HEAD (rollback target)** | `01e985570301790a40a451cc95e6eb01a9ae8e9f` | `Merge origin/VulnerabilityPatch into Environment/Prod (security patch)` |
| Source branch head | `ef7b01a3e598c39006fab42b756f5af9e16d02bd` | `V.2.2 database documentation guide` |
| Merge commit produced | `1b24db62bb1edd7cbe08871ec0f1a806913ef2a0` | `Merge origin/Environments/Test into Environment/Prod (v2.2)` |
| Safety tag | `pre-test-merge-v22` → `01e98557` | (note: `pre-test-merge` is the older v2.0 anchor — do not confuse) |
| Conflicts resolved | `.gitignore` — both sides added **different** ignore rules; kept the union (Prod's "Questions for Testing/…" + "TESTING ENVIRONMENT RESULTS/…" entries AND Test's "TestEnvironmentResults/BugRootCauseAnalysis" rule) | |
| Pushed to origin? | **No** — local only at time of writing | |

**To roll back, return `Environment/Prod` to `01e98557`.**

---

## Option A — Rollback BEFORE pushing (local only, cleanest)

The merge has NOT been pushed yet, so this is the recommended path.

```bash
cd "/docker-data/ubuntu/CAPS/PROD"
git reset --hard 01e985570301790a40a451cc95e6eb01a9ae8e9f
# equivalent: git reset --hard pre-test-merge-v22
```
Verify:
```bash
git log -1 --oneline    # should show: 01e98557 Merge origin/VulnerabilityPatch ...
git status              # clean (aside from previously untracked files)
```

---

## Option B — Rollback AFTER pushing (safe, history-preserving)

If the merge was already pushed to origin, do NOT force-push the shared production
branch. Create a revert commit instead.

```bash
cd "/docker-data/ubuntu/CAPS/PROD"
git revert -m 1 1b24db62bb1edd7cbe08871ec0f1a806913ef2a0   # -m 1 keeps the Prod side
git push origin Environment/Prod
```
⚠️ To re-merge Test later, `git revert` the revert first, then merge again.

---

## Option C — Hard rollback AFTER pushing (DESTRUCTIVE — only if approved)

```bash
cd "/docker-data/ubuntu/CAPS/PROD"
git reset --hard 01e985570301790a40a451cc95e6eb01a9ae8e9f
git push --force-with-lease origin Environment/Prod
```
⚠️ Rewrites shared history — coordinate with everyone on the branch first.

---

## ⚠️ Database rollback (this merge ADDED a migration)

Migration added:
**`Backend - Deployment/Modules/Users/Database/Migrations/2026_05_31_000000_create_user_code_reset_tokens_table.php`**
(creates the `user_code_reset_tokens` table).

If you ran `php artisan migrate` after merging, a code rollback alone leaves the
table behind. To also undo the DB change:

```bash
cd "/docker-data/ubuntu/CAPS/PROD/Backend - Deployment"

# Confirm what will be rolled back FIRST so unrelated migrations aren't reverted
php artisan migrate:status

# Roll back the most recent migration batch
php artisan migrate:rollback --step=1

# OR drop the table manually if needed:
# DROP TABLE user_code_reset_tokens;
```

---

## Insurance: git reflog (if the anchor was lost)

```bash
git reflog                            # find the entry for 01e98557 (pre-merge)
git reset --hard HEAD@{N}
```

---

## Post-rollback checklist

- [ ] `git log -1` shows `01e98557` (or a revert commit) as expected
- [ ] `user_code_reset_tokens` table dropped if `migrate` was run
- [ ] Frontend rebuilt if it was rebuilt for this merge
- [ ] App smoke-tested (login + affected modules: Users / password-reset flow)
