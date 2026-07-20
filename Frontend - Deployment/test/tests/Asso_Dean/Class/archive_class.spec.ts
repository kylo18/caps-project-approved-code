import { test, expect } from '@playwright/test';
import { login } from '../../Helpers/auth.js';
import { getClasses } from '../../Helpers/storage.js';

test('Dean can archive created classes', async ({ page }) => {
  // Login
  await login(
    page,
    process.env.ASSO_DEAN_USERNAME!,
    process.env.ASSO_DEAN_PASSWORD!
  );

  // Navigate
  await page.getByRole('link', { name: 'Class Classes' }).click();
  await page.getByRole('button').nth(4).click();

  const classes = getClasses();

  if (classes.length === 0) {
    throw new Error('No classes found in classes.json');
  }

  // Archive the first class from inside
  await page.getByText(classes[0], { exact: false }).click();

  await page.getByRole('button', {
    name: ' Archive class',
  }).click();

  await page.getByRole('button', { name: 'Confirm' }).click();

  // Return to class list
  await page.getByRole('link', { name: 'Class Classes' }).click();
  
  // Archive the remaining classes from the class list
  for (let i = 1; i < classes.length; i++) {
    await page.getByTitle('Archive Class').first().click();

    await page.getByRole('button', {
      name: 'Confirm',
    }).click();

    await expect(
      page.getByText(/Class archived successfully/i)
    ).toBeVisible();
  }
});