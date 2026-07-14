import { test, expect } from '@playwright/test';

test('Dean can create a new subject', async ({ page }) => {
  // Generate unique test data
  const subjectName = `Test-${Date.now()}`;
  const subjectCode = `SUB${Date.now()}`;

  await page.goto('https://caps-test.coeofjrmsu.com/');
  await page.getByRole('button', { name: 'LOG IN' }).click();
  await page.getByRole('textbox', { name: 'e.g. 23-A-' }).fill(process.env.PROGRAM_CHAIR_USERNAME!);
  await page.getByRole('textbox', { name: '••••••••••' }).fill(process.env.DEAN_PASSWORD!);
  await page.getByRole('button', { name: 'Login' }).click();
  await page.locator('button').filter({ has: page.locator('i.bx.bx-x') }).click();

  // Navigate to Subjects
  await page.getByRole('link', { name: 'Subjects Subjects' }).click();
  await page.getByRole('button', { name: 'Computer Engineering' }).click();

  // Open Create Subject dialog
  await page.getByRole('button', { name: /Create subject/i }).click();

  // Fill out the form
  await page.getByRole('textbox', { name: 'e.g. Calculus' }).fill(subjectName);
  await page.getByRole('textbox', { name: 'e.g. MATH123' }).fill(subjectCode);

  // Select Program
  await page.getByRole('button', { name: /Select Program/i }).click();
  await page.getByText('BS-CpE').click();

  // Select Year Level
    await page.getByRole('button', { name: 'Select Year Level ' }).click();
  await page.getByRole('listitem').filter({ hasText: '4th Year' }).click();
  
  // Submit
  await page.getByRole('button', { name: 'Add Subject' }).click();

  // Verify subject was created
  await expect(page.getByText(subjectName)).toBeVisible();
});