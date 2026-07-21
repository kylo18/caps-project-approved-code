import { test, expect } from '@playwright/test';
import { login } from '../../Helpers/auth.js';

test('Dean can copy and edit a quiz question', async ({ page }) => {
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

  // Copy Question
  await page.getByRole('button', { name: ' Copy' }).nth(1).click();

  // Edit copied question
  await page.getByText('Quiz Question-').nth(4).click();
  await page.getByText('Quiz Question-').nth(4).press('ControlOrMeta+a');
  await page.getByText('Quiz Question-').nth(4).fill('copy and edit 123');

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

  // Save copy
  await page.getByRole('button', { name: 'Copy', exact: true }).click();

  // Verify
  await expect(
    page.getByText(/Question copied to quiz!/i)
  ).toBeVisible();
});