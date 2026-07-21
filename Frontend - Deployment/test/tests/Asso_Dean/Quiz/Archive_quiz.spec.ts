import { test, expect } from '@playwright/test';
import { login } from '../../Helpers/auth.js';

test('Dean can archive quizzes', async ({ page }) => {
  // Login
  await login(
    page,
    process.env.ASSO_DEAN_USERNAME!,
    process.env.ASSO_DEAN_PASSWORD!
  );

  // Navigate
  await page.getByRole('link', { name: 'Library Quizzes' }).click();
  await page.getByRole('button').nth(4).click();

  //
  // Archive first quiz (inside Edit)
  //
  await page.getByRole('button', { name: 'edit Edit' }).first().click();

  await page.getByRole('button', { name: ' Archive' }).click();

  await page.getByRole('button', { name: ' Archive' }).nth(1).click();

  //
  // Archive second quiz (from quiz list)
  //
  await page.getByRole('button', { name: 'archive' }).nth(1).click();

  await expect(
    page.getByText(/Personal quiz archived/i)
  ).toBeVisible();
});