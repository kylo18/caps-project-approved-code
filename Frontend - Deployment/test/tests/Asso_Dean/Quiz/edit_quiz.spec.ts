import { test, expect } from '@playwright/test';
import { login } from '../../Helpers/auth.js';

test('Dean can edit a quiz', async ({ page }) => {
  // Login
  await login(
    page,
    process.env.ASSO_DEAN_USERNAME!,
    process.env.ASSO_DEAN_PASSWORD!
  );

  // Navigate
  await page.getByRole('link', { name: 'Library Quizzes' }).click();
  await page.getByRole('button').nth(4).click();

  // Open first quiz
  await page.getByRole('button', { name: 'edit Edit' }).first().click();

  // Edit quiz
  await page.getByRole('button', { name: ' Edit' }).click();

  // Update title
  const updatedTitle = `Custom Quiz-Modified-${Date.now()}`;

  await page.getByRole('textbox', { name: 'Enter quiz title' }).click();
  await page.getByRole('textbox', { name: 'Enter quiz title' }).dblclick();
  await page.getByRole('textbox', { name: 'Enter quiz title' }).fill(updatedTitle);

  // Update description
  await page.getByRole('textbox', { name: 'Enter quiz description' }).dblclick();
  await page.getByRole('textbox', { name: 'Enter quiz description' }).fill(
    'Automation Custom Modified'
  );

  // Save
  await page.getByRole('button', { name: 'Save Changes' }).click();

  // Verify
  await expect(
    page.getByText(/Quiz updated successfully/i)
  ).toBeVisible();
});