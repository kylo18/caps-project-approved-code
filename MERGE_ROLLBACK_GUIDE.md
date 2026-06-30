# Merge & Rollback Guide

Reference for safely merging `origin/Environments/Test` into local `Environment/Prod` and rolling back if needed.

---

## 🔖 ACTUAL MERGE PERFORMED — Rollback Anchors

Use this section for the merge done on **2026-06-01**.

| Item | Value |
|---|---|
| Pre-merge HEAD (Environment/Prod) | `598d5686` |
| Pre-merge commit message | "Allow caps.coeofjrmsu.com host in Vite and mark db_update.sh executable" |
| Safety tag created | `pre-test-merge` → `598d5686` |
| Source merged in | `origin/Environments/Test` @ `1b8ad69a` |
| Merge commit produced | `36b21922` |
| Merge commit message | "Merge origin/Environments/Test into Environment/Prod (v2.0)" |
| Conflicts resolved | `.gitignore` (whitespace only — kept Test's blank line) |
| Pushed to origin? | **No** — still local at time of guide write |

### Rollback commands for THIS merge

**If still local (not pushed):**
```bash
git reset --hard pre-test-merge
# equivalent to:
git reset --hard 598d5686
# equivalent to:
git reset --hard ORIG_HEAD   # only valid until next merge/reset
```

**If already pushed to origin:**
```bash
git revert -m 1 36b21922
git push origin Environment/Prod
```

**Verify rollback succeeded:**
```bash
git log -1                                  # HEAD should be 598d5686 (or the revert commit)
git rev-parse HEAD                          # confirm hash
```

---

## Before you merge — create a safety net

```bash
# Tag or branch the current state so you have a named anchor to return to
git tag pre-test-merge
# or
git branch backup/prod-before-test-merge
```

Capture the current commit hash (e.g. `git rev-parse HEAD`) — that's what you'd be rolling back to.

---

## Rollback options after the merge

### 1. Merge is local only (not pushed yet) — easiest

```bash
git reset --hard ORIG_HEAD
# or, equivalently, using the commit hash you captured:
git reset --hard <pre-merge-commit-hash>
# or, using the safety tag:
git reset --hard pre-test-merge
```

- `ORIG_HEAD` is set automatically by `git merge` to your pre-merge commit.
- Clean removal, no trace in history.
- **Destructive** — any uncommitted local changes are lost.

### 2. Merge already pushed to origin — use revert (safe, non-destructive)

```bash
git revert -m 1 <merge-commit-hash>
git push origin Environment/Prod
```

- `-m 1` tells revert "keep the first parent" (your Prod side) and undo the changes from the Test side.
- Creates a *new* commit that undoes the merge — history stays intact.
- ⚠️ Caveat: if you later try to re-merge Test, git will think those commits are "already merged." You'd need `git revert <the-revert>` first, then merge again.

### 3. Force-push to rewind origin (only if you're sure no one else pulled)

```bash
git reset --hard pre-test-merge
git push --force-with-lease origin Environment/Prod
```

- Rewrites history on the remote.
- **Dangerous** on a shared branch like Prod — anyone who pulled the merge will have a divergent local copy.
- `--force-with-lease` is safer than `--force` (refuses if remote moved unexpectedly).

---

## Insurance policy: `git reflog`

Even without a tag, git tracks every HEAD move locally for ~90 days:

```bash
git reflog                              # find the commit before the merge
git reset --hard HEAD@{N}               # rewind to it (N = entry number)
```

---

## Recommended sequence

```bash
# 1. Safety anchor
git tag pre-test-merge

# 2. Do the merge
git merge origin/Environments/Test

# 3. Test things...

# 4a. If bad AND not pushed:
git reset --hard pre-test-merge

# 4b. If bad AND already pushed:
git revert -m 1 HEAD
git push origin Environment/Prod
```

---

## Quick reference table

| Situation | Command | Destructive? |
|---|---|---|
| Just merged, not pushed | `git reset --hard ORIG_HEAD` | Yes (local only) |
| Pushed, want clean undo | `git revert -m 1 <merge-hash>` then push | No |
| Pushed, want to erase history | `git reset --hard <tag>` then `git push --force-with-lease` | Yes (shared) |
| Lost track of pre-merge state | `git reflog` to find it | No (read-only) |

---

## Cleanup after a successful merge

If the merge sticks and you no longer need the safety tag/branch:

```bash
git tag -d pre-test-merge                              # delete local tag
git branch -D backup/prod-before-test-merge            # delete backup branch
```
