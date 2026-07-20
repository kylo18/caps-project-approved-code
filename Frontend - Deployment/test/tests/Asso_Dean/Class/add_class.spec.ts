import { test, expect } from '@playwright/test';
import { login } from '../../Helpers/auth.js';
import { saveClass, clearClasses } from '../../Helpers/storage.js';

test('Dean can create classes', async ({ page }) => {
  // Login
  await login(
    page,
    process.env.ASSO_DEAN_USERNAME!,
    process.env.ASSO_DEAN_PASSWORD!
  );

  // Clear previous classes
  clearClasses();

  // Navigate to Classes
  await page.getByRole('link', { name: 'Class Classes' }).click();
  await page.getByRole('button').nth(4).click();

  for (let i = 1; i <= 2; i++) {
    const className = `Class-${Date.now()}-${i}`;

    // Open Create Class dialog
    await page.getByTitle('Create class').click();

    // Fill Class Details
    await page
      .getByRole('textbox', {
        name: 'e.g. Data Structures and',
      })
      .fill(className);

    await page
      .getByRole('textbox', {
        name: 'Summarize what this class is',
      })
      .fill(`Automation Test ${i}`);

    await page
      .getByRole('textbox', {
        name: 'e.g. M/W 10:00 AM – 11:30 AM',
      })
      .fill('Mon/Wed 10:00 AM - 11:30 AM');

    // Create Class
    await page.getByRole('button', { name: 'Create Class' }).click();

    // Verify Success
    await expect(
      page.getByText(/Class created successfully/i)
    ).toBeVisible();

    // Save this class name
    saveClass(className);
  }
});