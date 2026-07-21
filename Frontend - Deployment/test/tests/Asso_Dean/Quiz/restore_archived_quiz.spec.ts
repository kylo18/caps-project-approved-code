import { test, expect } from '@playwright/test';
import { login } from '../../Helpers/auth.js';

test('Dean can restore archived quizzes', async ({ page }) => {
  // Login
  await login(
    page,
    process.env.ASSO_DEAN_USERNAME!,
    process.env.ASSO_DEAN_PASSWORD!
  );

  // Navigate
  await page.getByRole('link', { name: 'Library Quizzes' }).click();
  await page.getByRole('button').nth(4).click();

  // Open Archived Quizzes
  await page.getByRole('button', { name: 'archive Archive' }).click();

  // Restore first quiz
  await page.getByRole('button', { name: ' Restore' }).first().click();

  await expect(
    page.getByText(/Personal quiz unarchived successfully/i)
  ).toBeVisible();

  // Restore second quiz
  await page.getByRole('button', { name: ' Restore' }).first().click();

  await expect(
    page.getByText(/Personal quiz unarchived successfully/i)
  ).toBeVisible();
});