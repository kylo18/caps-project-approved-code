import { test, expect } from '@playwright/test';

test('Dean can edit a pending question', async ({ page }) => {
  const copiedQuestion = `Copied-${Date.now()}`;
  await page.goto('https://caps-test.coeofjrmsu.com/');

  // Login
  await page.getByRole('button', { name: 'LOG IN' }).click();
  await page
    .getByRole('textbox', { name: 'e.g. 23-A-' })
    .fill(process.env.PROGRAM_CHAIR_USERNAME!);
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
  // Open Practice Questions
  await page.getByRole('button', { name: 'Qualifying Exam' }).click();

  // Copy Question
  await page.getByRole('button', { name: /Copy/i }).nth(1).click();

  // Change Category
  await page.getByRole('button', { name: 'Qualifying Exam ' }).click();
  await page.getByText('Practice', { exact: true }).click();

  // Change Title
  await page.locator('.overflow-wrap-anywhere').fill(copiedQuestion);

  // Copy
  await page.getByRole('button', { name: /^Copy$/ }).click();

  // Wait for copy to finish
  await page.waitForTimeout(3000);

  // Verify
  await expect(
    page.getByText(/Question copied successfully! now waiting for approval/i)
  ).toBeVisible();
  });