import { test, expect } from '@playwright/test';
import { login } from '../../Helpers/auth.js';

test('Dean can remove quiz questions', async ({ page }) => {
  // Login
  await login(
    page,
    process.env.ASSO_DEAN_USERNAME!,
    process.env.ASSO_DEAN_PASSWORD!
  );

  // Navigate
  await page.getByRole('link', { name: 'Library Quizzes' }).click();
  await page.getByRole('button').nth(4).click();

  // Open Quiz
  await page.getByRole('button', { name: 'edit Edit' }).first().click();

  // Manage Questions
  await page.getByRole('button', { name: '易 Manage Questions' }).click();

  // Remove first question
  await page.getByRole('button', { name: ' Remove' }).nth(1).click();
  await page.getByRole('button', { name: 'Confirm' }).click();

  await expect(
    page.getByText(/Question removed successfully/i)
  ).toBeVisible();

  // Remove second question
  await page.getByRole('button', { name: ' Remove' }).nth(1).click();
  await page.getByRole('button', { name: 'Confirm' }).click();

  await expect(
    page.getByText(/Question removed successfully/i)
  ).toBeVisible();
});