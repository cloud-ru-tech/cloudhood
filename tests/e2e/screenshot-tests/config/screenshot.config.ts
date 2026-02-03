export const SCREENSHOT_CONFIG = {
  themes: ['light', 'dark'] as const,
  browsers: ['chrome', 'firefox'] as const,
  platform: process.env.PLATFORM || 'darwin',
  defaults: {
    maxDiffPixels: 100,
    maxDiffPixelRatio: 0.01,
    timeout: 5000,
    threshold: 0.2,
  },
  selectors: {
    tabs: {
      headers: '[role="tab"]:has-text("Headers")',
      urlFilters: '[role="tab"]:has-text("URL Filters")',
    },
    headers: {
      section: '[data-test-id="profile-headers-section"]',
      addButton: '[data-test-id="add-request-header-button"]',
      nameInput: '[data-test-id="header-name-input"] input',
      valueInput: '[data-test-id="header-value-input"] input',
      checkbox: '[data-test-id="request-header-checkbox"]',
      toggleAllCheckbox: '[data-test-id="all-request-headers-checkbox"]',
      menuButton: '[data-test-id="request-header-menu-button"]',
      removeButton: '[data-test-id="remove-request-header-button"]',
    },
    urlFilters: {
      section: '[data-test-id="url-filters-section"]',
      input: '[data-test-id="url-filter-input"] input',
      row: '[data-test-id="url-filter-input"]',
      menuButton: '[data-test-id="url-filter-menu-button"]',
      addButton: '[data-test-id="add-url-filter-button"]',
      removeAllButton: '[data-test-id="remove-all-url-filters-button"]',
      checkbox: '[data-test-id="url-filter-checkbox"]',
      toggleAllCheckbox: '[data-test-id="all-url-filters-checkbox"]',
    },
    profiles: {
      select: '[data-test-id="profile-select"]',
      addButton: '[data-test-id="add-profile-button"]',
      actionsMenuButton: '[data-test-id="profile-actions-menu-button"]',
      nameEditButton: '[data-test-id="profile-name-edit-button"]',
      nameInput: 'input[placeholder="Profile name"]',
    },
    general: {
      themeToggleButton: '[data-test-id="theme-toggle-button"]',
      pauseButton: '[data-test-id="pause-button"]',
    },
    modals: {
      title: '[data-test-id="modal__title"]',
      importTextarea: '[data-test-id="import-profile-json-textarea"] textarea',
      exportTextarea: '[data-test-id="export-profile-json-textarea"] textarea',
      genericTextarea: '[data-test-id="field-textarea__input"]',
    },
    floatingMenu: {
      menu: '[data-floating-ui-portal] [role="menu"]',
      menuItem: '[data-floating-ui-portal] [role="menuitem"]',
    },
  },
} as const;

export type Theme = (typeof SCREENSHOT_CONFIG.themes)[number];
export type Browser = (typeof SCREENSHOT_CONFIG.browsers)[number];
