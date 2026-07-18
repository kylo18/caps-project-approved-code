// helpers/auth.ts

import { Page } from '@playwright/test';

export async function login(
  page: Page,
  username: string,
  password: string
) {
  await page.goto('https://caps-test.coeofjrmsu.com/');

  await page.getByRole('button', { name: 'LOG IN' }).click();

  await page
    .getByRole('textbox', { name: 'e.g. 23-A-' })
    .fill(username);

  await page
    .getByRole('textbox', { name: '••••••••••' })
    .fill(password);

  await page.getByRole('button', { name: 'Login' }).click();

  // Close announcement if it appears
  const closeAnnouncement = page
    .locator('button')
    .filter({ has: page.locator('i.bx.bx-x') });

  if (await closeAnnouncement.isVisible().catch(() => false)) {
    await closeAnnouncement.click();
  }
}