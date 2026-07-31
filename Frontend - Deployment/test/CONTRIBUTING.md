# Contributing Guide

## Folder Naming

Roles use PascalCase

```
Dean

Asso_Dean

PROGRAM_CHAIR

Faculty
```

---

## File Naming

Use

```
feature-name.spec.ts
```

Examples

```
add-question.spec.ts

edit-question.spec.ts

remove-question.spec.ts
```

---

## Helper Usage

Always use

```ts
login(...)
```

Never duplicate login code.

---

Always save generated data.

```ts
saveClass()

saveQuizQuestion()

saveSubject()
```

---

Never hardcode generated values.

❌

```ts
Quiz Question-1784627001
```

✅

```ts
const question =
getLatestQuizQuestion();
```

---

Keep images inside

```
assets/images
```

Never reference Desktop paths.

---

Always verify success.

Example

```ts
await expect(
page.getByText(/success/i)
).toBeVisible();
```

---

Use comments

```ts
// Login

// Navigate

// Save

// Verify
```

for consistency.