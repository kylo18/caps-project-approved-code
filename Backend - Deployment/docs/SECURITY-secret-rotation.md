# Secret Rotation Runbook (CAPS Backend)

The SQLite database `caps_project` was previously committed to version control and
contained user records (including bcrypt password hashes). It has now been removed
from tracking and git-ignored, but **anything that was ever committed must be
treated as compromised** and rotated. This runbook covers `APP_KEY`,
`MAIL_PASSWORD`, the database password, and user password hashes.

> Run everything from the `Backend - Deployment` directory. Take a database
> backup first (`backup-mysql.ps1` / `mysqldump`).

---

## 0. Purge the file from git history (one-time)

Removing the file from the current commit does **not** remove it from history.
Scrub it and force-push (coordinate with the team — this rewrites history):

```bash
# from repo root
pip install git-filter-repo   # or use the BFG
git filter-repo --path "Backend - Deployment/caps_project" --invert-paths
git push --force --all
git push --force --tags
```

Anyone with a clone must re-clone afterwards.

---

## 1. Database password

1. Rotate the MySQL account password to a long random value:
   ```sql
   ALTER USER 'kylo'@'%' IDENTIFIED BY '<new-strong-random-password>';
   FLUSH PRIVILEGES;
   ```
2. Update `DB_PASSWORD` in the production `.env`.
3. Restart the app / queue workers: `php artisan config:clear`.

## 2. Mail credential (Gmail app password)

1. Revoke the leaked Google **App Password** at
   <https://myaccount.google.com/apppasswords>.
2. Generate a new one (or migrate to a transactional provider).
3. Update `MAIL_PASSWORD` (and `MAIL_USERNAME` if changed) in `.env`.
4. `php artisan config:clear`.

## 3. APP_KEY  ⚠️ READ THIS FIRST

`APP_KEY` is **not only** used for cookie/session encryption — this app also
uses `Crypt::encryptString()/decryptString()` to store **question and choice
text** (`questions.questionText`, `choices.choiceText`). **Rotating `APP_KEY`
without re-encrypting that data will make the entire question bank
undecryptable.**

Safe rotation procedure:

1. **Back up the database.**
2. Put the app in maintenance mode: `php artisan down`.
3. Decrypt-then-reencrypt the question bank with the OLD key still active, using
   a transitional approach — e.g. a one-off console command / Tinker script that,
   for every `questions.questionText` and `choices.choiceText`:
   - decrypts with the current key, and
   - holds the plaintext in memory or a temporary column.
   ```php
   // php artisan tinker  (with the OLD APP_KEY still in .env)
   use Modules\Questions\Models\Question;
   use Modules\Choices\Models\Choice;
   use Illuminate\Support\Facades\Crypt;

   // Stash plaintext into a temp file keyed by id (do NOT log it).
   $dump = ['q' => [], 'c' => []];
   Question::chunk(200, function ($qs) use (&$dump) {
       foreach ($qs as $q) { try { $dump['q'][$q->questionID] = Crypt::decryptString($q->questionText); } catch (\Throwable $e) {} }
   });
   Choice::chunk(500, function ($cs) use (&$dump) {
       foreach ($cs as $c) { if ($c->choiceText) { try { $dump['c'][$c->choiceID] = Crypt::decryptString($c->choiceText); } catch (\Throwable $e) {} } }
   });
   file_put_contents(storage_path('app/reencrypt.json'), json_encode($dump));
   ```
4. Generate the new key: `php artisan key:generate` (updates `.env`).
5. Re-encrypt with the NEW key active:
   ```php
   // php artisan tinker  (with the NEW APP_KEY in .env)
   use Modules\Questions\Models\Question;
   use Modules\Choices\Models\Choice;
   use Illuminate\Support\Facades\Crypt;
   $dump = json_decode(file_get_contents(storage_path('app/reencrypt.json')), true);
   foreach ($dump['q'] as $id => $txt) { Question::where('questionID',$id)->update(['questionText'=>Crypt::encryptString($txt)]); }
   foreach ($dump['c'] as $id => $txt) { Choice::where('choiceID',$id)->update(['choiceText'=>Crypt::encryptString($txt)]); }
   @unlink(storage_path('app/reencrypt.json'));
   ```
6. `php artisan config:clear` and `php artisan up`.
7. Existing sessions/tokens are invalidated by the key change — users re-login.

> If you cannot re-encrypt safely, **do not rotate `APP_KEY`**; instead prioritise
> the DB password, mail password, and user password resets below.

## 4. User password hashes

Hashes that were in the committed DB are compromised. Force a reset:

1. Revoke all active API tokens:
   ```php
   // php artisan tinker
   DB::table('personal_access_tokens')->delete();
   ```
2. Require affected users to reset via the existing "Forgot password" flow, or
   invalidate current passwords (e.g. set a random hash) and notify users to
   reset. Do **not** email plaintext passwords.

---

## 5. Production environment hardening (verify)

Ensure the production `.env` has:

```dotenv
APP_ENV=production
APP_DEBUG=false
LOG_LEVEL=error
SESSION_SECURE_COOKIE=true
FRONTEND_URL=https://<your-frontend-domain>   # drives CORS allow-list
```

API error responses are additionally sanitized centrally in `bootstrap/app.php`
(generic message + correlation `ref`), so raw exception detail is never returned
to clients even if `APP_DEBUG` is mistakenly left on.
