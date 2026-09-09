import { createScreenshotTest } from '../factories';

createScreenshotTest({
  area: 'settings',
  name: 'settings-page',
  description: 'CloudHood Extension - Settings page',
  setup: async popup => {
    await popup.openSettings();
  },
});
