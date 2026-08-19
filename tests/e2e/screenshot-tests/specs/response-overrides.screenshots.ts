import { createScreenshotTest } from '../factories';

createScreenshotTest({
  area: 'response-overrides',
  name: 'empty-state',
  description: 'CloudHood Extension - Modify responses empty state',
  setup: async popup => {
    await popup.responseOverridesTab.activate();
  },
});

createScreenshotTest({
  area: 'response-overrides',
  name: 'expanded',
  description: 'CloudHood Extension - Modify responses expanded card',
  setup: async popup => {
    await popup.responseOverridesTab.activate();
    await popup.responseOverridesTab.addOverride();
    await popup.responseOverridesTab.setUrl('https://example.com/api');
  },
});

createScreenshotTest({
  area: 'response-overrides',
  name: 'collapsed',
  description: 'CloudHood Extension - Modify responses collapsed card',
  setup: async popup => {
    await popup.responseOverridesTab.activate();
    await popup.responseOverridesTab.addOverride();
    await popup.responseOverridesTab.setUrl('https://example.com/api');
    await popup.responseOverridesTab.collapse();
  },
});

createScreenshotTest({
  area: 'response-overrides',
  name: 'invalid',
  description: 'CloudHood Extension - Modify responses invalid JSON',
  setup: async popup => {
    await popup.responseOverridesTab.activate();
    await popup.responseOverridesTab.addOverride();
    await popup.responseOverridesTab.setUrl('https://example.com/api');
    await popup.responseOverridesTab.setJson('{');
  },
});
