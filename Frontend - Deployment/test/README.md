# CAPS Playwright Automation Framework

Automated end-to-end testing framework for the **Computer-Aided Preparation System (CAPS)** using **Playwright + TypeScript**.

---

## Features

- Playwright automation
- Multiple user roles
- Dynamic test data
- JSON data storage
- Reusable helper functions
- Image upload automation
- Sequential execution
- Modular folder structure

---

## Roles Covered

- Program Chair
- Dean
- Associate Dean
- Faculty

---

## Project Structure

```text
tests/
│
├── Helpers/
├── data/
├── assets/
├── Dean/
├── Asso_Dean/
├── PROGRAM_CHAIR/
└── Faculty/
```

---

## Documentation

See:

- SETUP.md
- FRAMEWORK.md
- CONTRIBUTING.md
- TEST_CASES.md

---

## Running All Tests

```bash
node tests/run-all.cjs
```

Run a single test

```bash
npx playwright test tests/Dean/Quiz/add_quiz.spec.ts
```