import { test, expect } from '@playwright/test';
import { login } from '../../Helpers/auth.js';
import { getLatestQuizQuestion } from '../../Helpers/storage.js';

test('Dean can edit a quiz question', async ({ page }) => {
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

  // Edit Question
  await page.getByRole('button', { name: ' Edit' }).nth(3).click();

  const question = getLatestQuizQuestion();

  if (!question) {
    throw new Error('No quiz question found in question_quiz.json');
  }

  // Edit question title
  const questionField = page.getByText(question).nth(1);

  await questionField.click();
  await questionField.fill('Edited Question 123');

  // Change correct answer
  await page.getByTitle('Mark as correct').nth(3).click();

  // Remove existing image
  await page.getByTitle('Remove image').nth(1).click();

  // Upload new image
  await page.getByTitle('Add image').nth(1).click();
  await page
    .locator('.flex.flex-col.items-center > .hidden')
    .setInputFiles('assets/images/7u7caf.png');
  await page.getByRole('button', { name: 'Apply Crop' }).click();

  // Replace image again
  await page.getByTitle('Add image').nth(1).click();
  await page
    .locator('.flex.flex-col.items-center > .hidden')
    .setInputFiles('assets/images/Untitled design.png');
  await page.getByRole('button', { name: 'Apply Crop' }).click();

  // Update
  await page.getByRole('button', { name: 'Update' }).click();

  // Verify
  await page.waitForTimeout(3000);
});