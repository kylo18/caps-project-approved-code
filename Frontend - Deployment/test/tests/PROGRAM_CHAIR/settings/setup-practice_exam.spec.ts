import { test, expect } from '@playwright/test';

test('Program chair can setup practice exam', async ({ page }) => {
  const numberOfQuestions = '2';
  await page.goto('https://caps-test.coeofjrmsu.com/');

  // Login
  await page.getByRole('button', { name: 'LOG IN' }).click();
  await page
    .getByRole('textbox', { name: 'e.g. 23-A-' })
    .fill(process.env.ASSO_DEAN_USERNAME!);
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

  // Open Settings
  await page.getByRole('button', { name: /Settings/i }).click();

  // Enable Randomize Questions
  await page.locator('.mb-6 > .relative > .peer.h-6').first().click();
 
  // Change Coverage
 const examButton = page.getByRole('button');

if (await page.getByRole('button', { name: 'Midterm ' }).isVisible()) {
  await page.getByRole('button', { name: 'Midterm ' }).click();
  await page.getByText('Full Coverage').click();

} else if (await page.getByRole('button', { name: 'Full Coverage ' }).isVisible()) {
  await page.getByRole('button', { name: 'Full Coverage ' }).click();
  await page.getByText('Finals', { exact: true }).click();

} else if (await page.getByRole('button', { name: 'Finals ' }).isVisible()) {
  await page.getByRole('button', { name: 'Finals ' }).click();
  await page.getByText('Midterm', { exact: true }).click();
}

  // Enable Question Limit
  await page.locator('div:nth-child(4) > .relative > .peer.h-6').click();

  // Set Number of Questions
  await page.getByRole('spinbutton').nth(1).fill(numberOfQuestions);

  // Save
  await page.getByRole('button', { name: /Save Changes/i }).click();

  // Wait for save to finish
  await page.waitForTimeout(3000);

  // Verify Success
  await expect(
    page.getByText(/Exam successfully configured!/i)
  ).toBeVisible();
});