import { expect, test } from './fixtures';

test.describe('Popup resize', () => {
  test('resizes the popup from the left handle and restores the size', async ({ page, extensionId }) => {
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    const handle = page.locator('[data-test-id="popup-resize-handle"]');
    await expect(handle).toBeVisible();

    const handleBox = await handle.boundingBox();
    expect(handleBox).not.toBeNull();
    if (handleBox === null) {
      throw new Error('Unable to measure the popup resize handle');
    }

    expect(handleBox.x).toBeLessThan(20);

    await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(handleBox.x + handleBox.width / 2 + 80, handleBox.y + handleBox.height / 2 - 50);
    await page.mouse.up();

    const readPopupSize = () =>
      page.evaluate(() => ({
        width: document.documentElement.style.width,
        height: document.documentElement.style.height,
      }));

    await expect.poll(async () => (await readPopupSize()).width).not.toBe('');
    const resized = await readPopupSize();
    const resizedWidth = Number.parseInt(resized.width, 10);
    const resizedHeight = Number.parseInt(resized.height, 10);
    expect(resizedWidth).toBeGreaterThanOrEqual(480);
    expect(resizedWidth).toBeLessThan(630);
    expect(resizedHeight).toBeGreaterThanOrEqual(400);
    expect(resizedHeight).toBeLessThan(492);

    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect.poll(async () => page.evaluate(() => document.documentElement.style.width)).toBe(resized.width);
    await expect.poll(async () => page.evaluate(() => document.documentElement.style.height)).toBe(resized.height);
  });
});
