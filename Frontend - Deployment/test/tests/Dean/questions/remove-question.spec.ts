import { test, expect } from '@playwright/test';

test('Dean can remove a pending question', async ({ page }) => {
  await page.goto('https://caps-test.coeofjrmsu.com/');

  // Login
  await page.getByRole('button', { name: 'LOG IN' }).click();
  await page
    .getByRole('textbox', { name: 'e.g. 23-A-' })
    .fill(process.env.DEAN_USERNAME!);
  await page
    .getByRole('textbox', { name: '••••••••••' })
    .fill(process.env.DEAN_PASSWORD!);
  await page.getByRole('button', { name: 'Login' }).click();

  // Close announcement
  await page
    .locator('button')
    .filter({ has: page.locator('i.bx.bx-x') })
    .click();

  // Navigate
  await page.getByRole('link', { name: /Subjects/i }).click();
  await page.getByRole('button', { name: /Computer Engineering/i }).click();
  await page.getByText('Test Subject').click();
  await page.getByRole('button', { name: /Manage Questions/i }).click();
  await page.getByRole('button', { name: 'Pending' }).click();

  // Remove Question
  await page.getByRole('button', { name: /Remove/i }).first().click();
  await page.getByRole('button', { name: 'Confirm' }).click();

  // Wait for deletion to complete
  await page.waitForTimeout(3000);

  // Verify Success
  await expect(
    page.getByText(/Question deleted successfully!/i)
  ).toBeVisible();

  });