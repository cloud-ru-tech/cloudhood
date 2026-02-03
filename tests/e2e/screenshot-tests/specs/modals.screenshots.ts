import { createScreenshotTest } from '../factories';
import { ModalsPage } from '../page-objects';

createScreenshotTest({
  area: 'modals',
  name: 'export-modal',
  description: 'CloudHood Extension - Export profile modal',
  snapshotOptions: {
    maxDiffPixels: 500,
  },
  setup: async popup => {
    await popup.headersTab.addHeader('X-Export', 'value');
    await popup.sidebar.openProfileActionsMenu();
    const modals = new ModalsPage(popup.page);
    await modals.openExportModal();
    await modals.fillExportJsonExpected();
    await popup.page.evaluate(() => {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    });
  },
});

createScreenshotTest({
  area: 'modals',
  name: 'import-modal',
  description: 'CloudHood Extension - Import profile modal',
  setup: async popup => {
    await popup.sidebar.openProfileActionsMenu();
    const modals = new ModalsPage(popup.page);
    await modals.openImportModal();
  },
});

createScreenshotTest({
  area: 'modals',
  name: 'import-from-extension',
  description: 'CloudHood Extension - Import from other extension modal',
  setup: async popup => {
    await popup.sidebar.openProfileActionsMenu();
    const modals = new ModalsPage(popup.page);
    await modals.openImportFromExtension();
  },
});

createScreenshotTest({
  area: 'modals',
  name: 'delete-confirmation',
  description: 'CloudHood Extension - Remove all URL filters confirmation',
  setup: async popup => {
    const modals = new ModalsPage(popup.page);
    await popup.urlFiltersTab.activate();
    await popup.urlFiltersTab.setFilterValue('https://remove.example.com/*');
    await popup.urlFiltersTab.openRemoveAllModal();
    await modals.waitForTitle('Remove all URL filters');
  },
});
