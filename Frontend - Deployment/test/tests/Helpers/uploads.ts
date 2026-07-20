// helpers/uploads.ts

import { Page } from '@playwright/test';

export async function uploadImage(
  page: Page,
  imagePath: string,
  index = 0
) {
  // Remove existing image if present
  const removeButton = page
    .locator('.absolute.top-2.right-2.flex')
    .nth(index);

  if (await removeButton.isVisible().catch(() => false)) {
    await removeButton.click();
  }

  // Open image picker
  await page.getByTitle('Add image').nth(index).click();

  // Upload image
  await page
    .locator('input[type="file"]')
    .nth(index)
    .setInputFiles(imagePath);

  // Crop if cropper appears
  const cropButton = page.getByRole('button', {
    name: 'Apply Crop',
  });

  if (await cropButton.isVisible().catch(() => false)) {
    await cropButton.click();
  }
}