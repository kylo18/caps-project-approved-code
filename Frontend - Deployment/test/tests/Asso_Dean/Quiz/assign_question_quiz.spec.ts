import { test, expect } from '@playwright/test';
import { login } from '../../Helpers/auth.js';

test('Dean can assign a quiz', async ({ page }) => {
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

  // Assign Quiz
  await page.getByRole('button', { name: '淚 Assign' }).click();

  // Select Class
  await page.getByRole('button', { name: 'Select a class' }).click();
  await page.locator('.mt-1.h-4').check();
  await page.getByRole('button', { name: 'Assign Quiz' }).click();

  // Schedule
  await page.getByRole('button', { name: 'Change', exact: true }).click();
  await page.getByPlaceholder('-07-21T17:01').fill('2026-07-21T17:01');
  await page.getByRole('textbox').nth(2).fill('2026-07-22T17:01');
  await page.getByRole('button', { name: 'Save' }).click();

  // Availability
  await page.getByRole('button', { name: '1 day' }).click();
  await page.getByRole('button', { name: '1 day' }).click();

  // Attempts
  await page.locator('.outfit-400 > .relative > .peer.h-6').click();
  await page.getByRole('spinbutton').click();
  await page.getByRole('spinbutton').fill('2');

  // Timer
  await page.locator('.flex.items-center.gap-3 > .relative > .peer.h-6').click();
  await page.locator('input[name="quizTimer"]').click();
  await page.locator('input[name="quizTimer"]').fill('1');

  // Settings
  await page.locator('.space-y-4 > div > .relative > .peer.h-6').first().click();
  await page.locator('.space-y-4 > div:nth-child(2) > .relative > .peer.h-6').click();
  await page.locator('.outfit-400.mb-6 > .space-y-4 > div > .relative > .peer.h-6').first().click();
  await page.locator('.outfit-400.mb-6 > .space-y-4 > div:nth-child(2) > .relative > .h-6').click();
  await page.locator('div:nth-child(3) > .relative > .peer.h-6').click();

  // Save Assignment
  await page.getByRole('button', { name: 'Assign', exact: true }).click();

  // Verify
  await expect(
    page.getByText(/Quiz settings saved successfuly/i)
  ).toBeVisible();
});