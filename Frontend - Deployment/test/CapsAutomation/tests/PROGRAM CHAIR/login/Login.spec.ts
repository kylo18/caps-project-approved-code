import { test, expect } from '@playwright/test';

test('Login', async ({ page }) => {
  await page.goto('https://caps-test.coeofjrmsu.com/');
  await page.getByRole('button', { name: 'LOG IN' }).click();
  await page.getByRole('textbox', { name: 'e.g. 23-A-' }).fill(process.env.PROGRAM_CHAIR_USERNAME!);
  await page.getByRole('textbox', { name: '••••••••••' }).fill(process.env.DEAN_PASSWORD!);
  await page.getByRole('button', { name: 'Login' }).click();
  await page.locator('button').filter({ has: page.locator('i.bx.bx-x') }).click();
});