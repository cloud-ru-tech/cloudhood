import { createScreenshotTest } from '../factories';

createScreenshotTest({
  area: 'url-filters',
  name: 'empty-state',
  description: 'CloudHood Extension - URL Filters empty state',
  setup: async popup => {
    await popup.urlFiltersTab.activate();
  },
});

createScreenshotTest({
  area: 'url-filters',
  name: 'single-filter',
  description: 'CloudHood Extension - URL Filters with single filter',
  setup: async popup => {
    await popup.urlFiltersTab.activate();
    await popup.urlFiltersTab.setFilterValue('https://example.com/*');
  },
});

createScreenshotTest({
  area: 'url-filters',
  name: 'multiple-filters',
  description: 'CloudHood Extension - URL Filters with multiple filters',
  setup: async popup => {
    await popup.urlFiltersTab.activate();
    await popup.urlFiltersTab.setFilterValue('https://api.example.com/*', 0);
    await popup.urlFiltersTab.addFilter();
    await popup.urlFiltersTab.setFilterValue('https://cdn.example.com/*', 1);
  },
});

createScreenshotTest({
  area: 'url-filters',
  name: 'disabled-filter',
  description: 'CloudHood Extension - URL Filters with disabled filter',
  setup: async popup => {
    await popup.urlFiltersTab.activate();
    await popup.urlFiltersTab.setFilterValue('https://disabled.example.com/*', 0);
    await popup.urlFiltersTab.disableFilter(0);
  },
});

createScreenshotTest({
  area: 'url-filters',
  name: 'filter-menu-open',
  description: 'CloudHood Extension - URL Filter menu open',
  setup: async popup => {
    await popup.urlFiltersTab.activate();
    await popup.urlFiltersTab.setFilterValue('https://menu.example.com/*', 0);
    await popup.urlFiltersTab.openFilterMenu(0);
  },
});
