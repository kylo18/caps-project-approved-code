import { test, expect } from '@playwright/test';

test('Dean can edit a pending question', async ({ page }) => {
  // Updated Data
  const updatedQuestion = `Modified-${Date.now()}`;
  const updatedOptionA = 'Test';
  const updatedOptionB = 'Hello';
  const updatedOptionC = 'Testing';

  await page.goto('https://caps-test.coeofjrmsu.com/');

  // Login
  await page.getByRole('button', { name: 'LOG IN' }).click();
  await page
    .getByRole('textbox', { name: 'e.g. 23-A-' })
    .fill(process.env.FACULTY_USERNAME!);
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

  await page.getByRole('button', { name: ' Edit' }).nth(1).click();

  // Upload Question Image
  await page.getByTitle('Add image').first().click();
  await page.locator('.flex.flex-col > .hidden').setInputFiles('Untitled design.png');
  await page.getByRole('button', { name: 'Apply Crop' }).click();

  await page.getByTitle('Add image').nth(1).click();
  await page.locator('.flex.flex-col.items-center > .hidden').setInputFiles('7u7caf.png');
  await page.getByRole('button', { name: 'Apply Crop' }).click();

  // Update Question Title
  await page.locator('.overflow-wrap-anywhere').fill(updatedQuestion);

  // Update Options
  const optionInputs = page.locator('.-mt-4');

  await optionInputs.nth(1).fill(updatedOptionA);
  await optionInputs.nth(2).fill(updatedOptionB);
  await optionInputs.nth(3).fill(updatedOptionC);

  // Change Correct Answer
  await page.getByTitle('Mark as correct').first().click();

  // Change Category
  await page.getByRole('button', { name: 'Practice ' }).click();
  await page.getByRole('listitem').filter({ hasText: 'Qualifying Exam' }).click();

  // Change Exam
  await page.getByRole('button', { name: 'Midterms ' }).click();
  await page.getByText('Finals', { exact: true }).click();

  //Change Difficulty
  await page.getByRole('button', { name: 'Easy ' }).click();
  await page.getByText('Hard', { exact: true }).click();

  // Update
  await page.getByRole('button', { name: 'Update' }).click();

await expect(
  page.getByRole('button', { name: 'Update' })
).toBeHidden();

  // Wait until the Pending page is visible again
await page.waitForTimeout(3000);

await expect(
    page.getByText(/Question is now pending for approval!/i)
  ).toBeVisible();
});