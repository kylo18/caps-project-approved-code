import { test, expect } from '@playwright/test';

test('Dean can add a multiple-choice question', async ({ page }) => {
  // Test Data
  const subjectName = 'Test Subject';
  const questionTitle = `Question-${Date.now()}`;
  const questionText = 'Hello';
  const optionA = 'Tester';
  const optionB = 'Testing';
  const optionC = 'Lets Test';

  await page.goto('https://caps-test.coeofjrmsu.com/');

  // Login
  await page.getByRole('button', { name: 'LOG IN' }).click();
  await page.getByRole('textbox', { name: 'e.g. 23-A-' }).fill(process.env.PROGRAM_CHAIR_USERNAME!);
  await page.getByRole('textbox', { name: '••••••••••' }).fill(process.env.DEAN_PASSWORD!);
  await page.getByRole('button', { name: 'Login' }).click();

  // Close announcement/modal if present
  await page.locator('button').filter({ has: page.locator('i.bx.bx-x') }).click();

  // Navigate to Subject
  await page.getByRole('link', { name: /Subjects/i }).click();
  await page.getByRole('button', { name: /Computer Engineering/i }).click();
  await page.getByText(subjectName).click();

  // Open Question Manager
  await page.getByRole('button', { name: /Manage Questions/i }).click();
  await page.getByRole('button', { name: /Add Question/i }).click();

  // Fill Question
  await page.locator('.overflow-wrap-anywhere').fill(questionTitle);
  await page.locator('.-mt-4.w-full.resize-none').first().fill(questionText);

  // Fill Options
  await page
    .locator('.outfit-400.relative.rounded-lg.bg-gray-100 > .mt-8 > .relative > .-mt-4')
    .first()
    .fill(optionA);

  await page
    .locator('div:nth-child(3) > .mt-8 > .relative > .-mt-4')
    .fill(optionB);

  await page
    .locator('div:nth-child(4) > .mt-8 > .relative > .-mt-4')
    .fill(optionC);

  // Mark Correct Answer
  await page.getByTitle('Mark as correct').nth(4).click();

  // Save
  await page.getByRole('button', { name: 'Save' }).click();

  // Wait for success toast
  await expect(
    page.getByText(/Question is now pending for approval!/i)
  ).toBeVisible();

  // Verify the question appears
  await page.getByRole('button', { name: 'Pending' }).click();
  await expect(page.getByText(questionTitle)).toBeVisible();
});