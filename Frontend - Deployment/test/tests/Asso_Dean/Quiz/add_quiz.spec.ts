import { test, expect } from '@playwright/test';
import { login } from '../../Helpers/auth.js';

test('Dean can create quizzes', async ({ page }) => {
  // Login
  await login(
    page,
    process.env.ASSO_DEAN_USERNAME!,
    process.env.ASSO_DEAN_PASSWORD!
  );

  // Navigate
  await page.getByRole('link', { name: 'Library Quizzes' }).click();
  await page.getByRole('button').nth(4).click();

  //
  // Subject-based Quiz
  //
  const subjectQuiz = `Subject Quiz-${Date.now()}`;

  await page.getByRole('button', { name: ' Create Quiz' }).click();

  await page
    .getByRole('textbox', {
      name: 'e.g. Trigonometric Identities',
    })
    .fill(subjectQuiz);

  await page
    .getByRole('textbox', {
      name: 'Summarize the goal of this',
    })
    .fill('Automation Subject Quiz');

  await page.getByRole('button', { name: 'Next Step ' }).click();

  await page
    .getByRole('button', {
      name: ' Subject-based Link this',
    })
    .click();

  await page.getByRole('button', { name: 'Next Step ' }).click();

  await page
    .getByRole('button', {
      name: ' Computer Engineering 30',
    })
    .click();

  await page
    .getByRole('button', {
      name: 'Test123 teast2 · 4th Year',
    })
    .click();

  await page.getByRole('button', { name: 'Next Step ' }).click();

  await page
    .getByRole('button', {
      name: ' Finals Comprehensive',
    })
    .click();

  await page.getByRole('button', { name: 'Next Step ' }).click();

  await page
    .getByRole('button', {
      name: 'Create Quiz',
      exact: true,
    })
    .click();

  await expect(
    page.getByText(/Personal Quiz created successfully/i)
  ).toBeVisible();

  //
  // Custom Quiz
  //
  const customQuiz = `Custom Quiz-${Date.now()}`;

  await page.getByRole('button', { name: ' Create Quiz' }).click();

  await page
    .getByRole('textbox', {
      name: 'e.g. Trigonometric Identities',
    })
    .fill(customQuiz);

  await page
    .getByRole('textbox', {
      name: 'Summarize the goal of this',
    })
    .fill('Automation Custom Quiz');

  await page.getByRole('button', { name: 'Next Step ' }).click();

  await page
    .getByRole('button', {
      name: ' Custom Create a standalone',
    })
    .click();

  await page.getByRole('button', { name: 'Next Step ' }).click();

  await page
    .getByRole('button', {
      name: 'Create Quiz',
      exact: true,
    })
    .click();

  await expect(
    page.getByText(/Personal Quiz created successfully/i)
  ).toBeVisible();
  await page.pause();
});