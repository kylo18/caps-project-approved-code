// helpers/navigation.ts

import { Page } from '@playwright/test';

export async function goToSubjects(page: Page) {
  await page.getByRole('link', { name: /Subjects/i }).click();
}

export async function selectProgram(
  page: Page,
  program = 'Computer Engineering'
) {
  await page
    .getByRole('button', { name: new RegExp(program, 'i') })
    .click();
}

export async function openSubject(
  page: Page,
  subject = 'Test Subject'
) {
  await page.getByText(subject).click();
}

export async function openQuestionManager(page: Page) {
  await page
    .getByRole('button', { name: /Manage Questions/i })
    .click();
}

export async function openPending(page: Page) {
  await page.getByRole('button', { name: 'Pending' }).click();
}

export async function openApproved(page: Page) {
  await page.getByRole('button', { name: 'Approved' }).click();
}

export async function openPractice(page: Page) {
  await page.getByRole('button', { name: 'Practice' }).click();
}

export async function openSettings(page: Page) {
  await page.getByRole('button', { name: /Settings/i }).click();
}