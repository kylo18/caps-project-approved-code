import { test, expect } from '@playwright/test';
import { login } from '../../Helpers/auth.js';
import { getClasses } from '../../Helpers/storage.js';

test('Dean can permanently delete archived classes', async ({ page }) => {
  // Login
  await login(
    page,
    process.env.ASSO_DEAN_USERNAME!,
    process.env.ASSO_DEAN_PASSWORD!
  );

  // Navigate to Archived Classes
  await page.getByRole('link', { name: 'Class Classes' }).click();
  await page.getByRole('button').nth(4).click();
  await page.getByRole('button', { name: 'archived classes' }).click();

  const classes = getClasses();

  for (const _ of classes) {
    await page.getByTitle('Delete Class Permanently').first().click();

    await page.getByRole('button', {
      name: 'Confirm',
    }).click();

    await expect(
      page.getByText(/Class deleted successfully/i)
    ).toBeVisible();
  }
  await page.pause();
});