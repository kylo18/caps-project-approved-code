// helpers/wait.ts

import { expect, Locator, Page } from '@playwright/test';

export async function waitForToast(
  page: Page,
  message: string | RegExp
) {
  await expect(page.getByText(message)).toBeVisible({
    timeout: 30000,
  });
}

export async function waitForToastToDisappear(
  page: Page,
  message: string | RegExp
) {
  await expect(page.getByText(message)).toBeHidden({
    timeout: 30000,
  });
}

export async function waitForPending(page: Page) {
  await expect(
    page.getByRole('button', { name: 'Pending' })
  ).toBeVisible({
    timeout: 30000,
  });
}

export async function waitForUpdateFinished(page: Page) {
  await expect(
    page.getByRole('button', { name: 'Update' })
  ).toBeVisible({
    timeout: 30000,
  });
}

export async function waitForSaveFinished(page: Page) {
  await expect(
    page.getByRole('button', { name: 'Save' })
  ).toBeVisible({
    timeout: 30000,
  });
}

export async function waitForVisible(locator: Locator) {
  await expect(locator).toBeVisible({
    timeout: 30000,
  });
}

export async function waitForHidden(locator: Locator) {
  await expect(locator).toBeHidden({
    timeout: 30000,
  });
}

export async function wait(seconds: number) {
  await new Promise(resolve => setTimeout(resolve, seconds * 1000));
}