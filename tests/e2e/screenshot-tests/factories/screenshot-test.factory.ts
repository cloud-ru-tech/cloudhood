import { expect, test } from '../../fixtures';
import { SCREENSHOT_CONFIG, type Theme } from '../config/screenshot.config';
import { PopupPage } from '../page-objects';
import { getSnapshotName } from '../utils';

type SnapshotOptions = {
  maxDiffPixels?: number;
  maxDiffPixelRatio?: number;
  timeout?: number;
  threshold?: number;
};

type ScreenshotTestOptions = {
  area: string;
  name: string;
  description: string;
  themes?: Theme[];
  setup: (popup: PopupPage, theme: Theme) => Promise<void>;
  snapshotOptions?: SnapshotOptions;
};

export const createScreenshotTest = (options: ScreenshotTestOptions) => {
  const themes = options.themes ?? SCREENSHOT_CONFIG.themes;

  for (const theme of themes) {
    test(`${options.description} [${theme}]`, async ({ page, extensionId }) => {
      const popup = new PopupPage(page, extensionId);
      await popup.navigate();
      await popup.setTheme(theme);
      await popup.waitForReady();

      await options.setup(popup, theme);

      const snapshotName = getSnapshotName(options.area, options.name, theme);
      await expect(page).toHaveScreenshot(snapshotName, {
        ...SCREENSHOT_CONFIG.defaults,
        ...options.snapshotOptions,
      });
    });
  }
};
