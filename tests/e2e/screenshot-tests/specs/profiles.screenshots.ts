import { createScreenshotTest } from '../factories';

createScreenshotTest({
  area: 'profiles',
  name: 'single-profile',
  description: 'CloudHood Extension - Single profile in sidebar',
  setup: async popup => {
    await popup.headersTab.activate();
  },
});

createScreenshotTest({
  area: 'profiles',
  name: 'multiple-profiles',
  description: 'CloudHood Extension - Multiple profiles in sidebar',
  setup: async popup => {
    await popup.headersTab.activate();
    await popup.sidebar.addProfile();
  },
});

createScreenshotTest({
  area: 'profiles',
  name: 'profile-selected',
  description: 'CloudHood Extension - Selected profile',
  setup: async popup => {
    await popup.headersTab.activate();
    await popup.sidebar.addProfile();
    await popup.sidebar.selectProfile(1);
  },
});

createScreenshotTest({
  area: 'profiles',
  name: 'profile-editing-name',
  description: 'CloudHood Extension - Editing profile name',
  setup: async popup => {
    await popup.headersTab.activate();
    await popup.sidebar.startEditingProfileName();
  },
});

createScreenshotTest({
  area: 'profiles',
  name: 'profile-actions-menu',
  description: 'CloudHood Extension - Profile actions menu open',
  setup: async popup => {
    await popup.headersTab.activate();
    await popup.sidebar.openProfileActionsMenu();
  },
});
