import { test, expect } from '@playwright/test';
import { login } from '../../Helpers/auth.js';

test('Dean can add a question to a quiz', async ({ page }) => {
  // Login
  await login(
    page,
    process.env.ASSO_DEAN_USERNAME!,
    process.env.ASSO_DEAN_PASSWORD!
  );

  // Navigate
  await page.getByRole('link', { name: 'Library Quizzes' }).click();
  await page.getByRole('button').nth(4).click();

  // Open Quiz
  await page.getByRole('button', { name: 'edit Edit' }).first().click();

  // Manage Questions
  await page.getByRole('button', { name: '易 Manage Questions' }).click();

  // Add Question
  await page.getByRole('button', { name: ' Add Question' }).click();

  const questionTitle = `Quiz Question-${Date.now()}`;

  // Question Title
  await page.locator('.overflow-wrap-anywhere').fill(questionTitle);

  // Question Image
  await page.getByTitle('Add image').first().click();
  await page
    .locator('.flex.flex-col > .hidden')
    .setInputFiles('assets/images/Untitled design.png');
  await page.getByRole('button', { name: 'Apply Crop' }).click();

  // Question Text
  await page.locator('.-mt-4').first().fill('Test Question');

  // Option A
  await page
    .locator(
      '.outfit-400.relative.rounded-lg.bg-gray-100 > .mt-8 > .relative > .-mt-4'
    )
    .first()
    .fill('Option A');

  // Option A Image
  await page.getByTitle('Add image').nth(1).click();
  await page
    .locator('.flex.flex-col.items-center > .hidden')
    .setInputFiles('assets/images/7u7caf.png');
  await page.getByRole('button', { name: 'Apply Crop' }).click();

  // Option B
  await page
    .locator('div:nth-child(4) > .mt-8 > .relative > .-mt-4')
    .fill('Option B');

  // Option B Image
  await page.getByTitle('Add image').nth(2).click();
  await page
    .locator('.flex.flex-col.items-center > .hidden')
    .setInputFiles('assets/images/7u7caf.png');
  await page.getByRole('button', { name: 'Apply Crop' }).click();

  // Correct Answer
  await page.getByTitle('Mark as correct').nth(2).click();

  // Save
  await page.getByRole('button', { name: 'Save' }).click();

  // Verify
  await expect(
    page.getByText(/Question added to quiz/i)
  ).toBeVisible();
  await page.pause();
});