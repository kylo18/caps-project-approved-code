# Installation Guide

## Requirements

- Node.js
- Git
- Visual Studio Code

---

## Clone Repository

```bash
git clone <repository-url>
```

---

## Install Dependencies

```bash
npm install
```

---

## Install Playwright

```bash
npx playwright install
```

---

## Environment Variables

Create

```
.env
```

Example

```env
DEAN_USERNAME=
DEAN_PASSWORD=

ASSO_DEAN_USERNAME=
ASSO_DEAN_PASSWORD=

PROGRAM_CHAIR_USERNAME=
PROGRAM_CHAIR_PASSWORD=

FACULTY_USERNAME=
FACULTY_PASSWORD=
```

---

## Verify

```bash
npx playwright test
```