# CloudHood E2E Tests

## Overview

CloudHood has separate browser-extension E2E paths:

- Chrome functional tests: 58 Playwright scenarios using a Chromium persistent context and `build/chrome`.
- Firefox functional tests: 20 Selenium WebDriver scenarios using a temporary addon installation from `build/firefox`.
- Chrome screenshots: Playwright visual regression tests.
- Firefox screenshots: Selenium WebDriver visual regression tests using the same temporary addon launcher as the Firefox functional runner.

The Firefox runner is intentionally separate from Playwright. Playwright does not provide a Firefox WebExtension loading path equivalent to Chromium's persistent context with `--load-extension`.

## Functional Coverage Matrix

The existing 58 Chrome functional scenarios split into these portability groups:

| Group | Chrome scenarios | Firefox status |
| --- | ---: | --- |
| Popup DOM, tabs, pause, theme, header/filter editing, toggles, validation, profiles, persistence, icons | 48 | Browser-agnostic behavior; critical flows are covered by the Selenium runner |
| Wire-level header application and URL matching | 2 | Covered with Firefox DNR and a local HTTP echo server |
| Legacy profile storage injection | 1 | Covered through `browser.storage.local` from the Firefox popup |
| Clipboard mock scenarios | 4 | Gap: Playwright `addInitScript` clipboard mocking has not been ported |
| Chromium service-worker badge evaluation | 1 | Gap: Firefox background-page badge inspection has not been ported |
| New-tab GitHub link event | 1 | Gap: Selenium window-handle assertion has not been added |
| Export download event | 1 | Gap: Selenium download assertion has not been added |

The Firefox suite is not full parity. Its 20 scenarios cover popup load and tabs, theme persistence, pause persistence, request-header and URL-filter add/edit/remove/validation/toggle/duplicate/clear/persistence flows, remove-all confirmation, profile add/rename/delete/import, storage restore, legacy storage normalization, and Firefox DNR header behavior.

Known Firefox gaps include clipboard actions, badge inspection, the GitHub new-tab assertion, the export download assertion, ModHeader/Requestly import UI coverage, icon and compact-layout assertions, the extended URL-pattern matrix, and canceling the remove-all dialog.

## Directory Structure

```
tests/e2e/
├── screenshots.spec.ts                      # Entry point (imports specs)
├── fixtures.ts                              # Playwright fixtures
├── screenshot-tests/
│   ├── config/
│   │   └── screenshot.config.ts             # Centralized configuration
│   ├── utils/
│   │   ├── helpers.ts                       # Shared helpers
│   │   └── snapshot-naming.ts               # Snapshot naming
│   ├── page-objects/                        # Page Objects
│   ├── factories/
│   │   └── screenshot-test.factory.ts       # Test factory with themes
│   └── specs/                               # Feature-focused specs
└── screenshots.spec.ts-snapshots/           # Auto-generated snapshots
└── screenshots.firefox.spec.ts-snapshots/   # Auto-generated Firefox snapshots
```

## Core Concepts

### Test Factory

All screenshot tests are created through `createScreenshotTest()` which:
- Navigates to the popup
- Applies a theme (Light/Dark)
- Runs setup logic
- Takes a named snapshot

### Snapshot Naming

Snapshots are stored with the format:

```
{area}/{testName}-{theme}.png
```

Examples:
- `headers/empty-state-light.png`
- `url-filters/multiple-filters-dark.png`

Playwright will automatically add project suffixes for multi-browser runs.

## Adding a New Test

```ts
// tests/e2e/screenshot-tests/specs/headers.screenshots.ts
import { createScreenshotTest } from '../factories';

createScreenshotTest({
  area: 'headers',
  name: 'single-header',
  description: 'Headers tab with a single filled header',
  setup: async popup => {
    await popup.headersTab.activate();
    await popup.headersTab.addHeader('Authorization', 'Bearer token123');
  },
});
```

## Running Tests

### Snapshot generation (Docker)

```bash
# One command: builds Chrome + Firefox and updates Chrome + Firefox snapshots in Docker
pnpm test:e2e:screenshots:generate
```

Generate committed baselines in Docker. Firefox uses platform scrollbars, so locally generated macOS snapshots do not match the Linux CI layout.

```bash
# Verifies current snapshots without updating them
pnpm test:e2e:screenshots:check
```

### Local verification (Docker, matches CI)

```bash
# One command: builds Chrome + Firefox and checks Chrome + Firefox snapshots in Docker
pnpm test:e2e:screenshots:check
```

### Local runs

```bash
# Chrome functional suite
pnpm test:e2e:ci

# Firefox functional suite (requires a local Firefox binary)
pnpm build:firefox
pnpm test:e2e:firefox

# Firefox functional suite in the existing screenshot image
pnpm test:e2e:firefox:docker

# All screenshot tests
pnpm test:e2e:screenshots

# Update Chrome + Firefox snapshots
pnpm test:e2e:screenshots:update

# Chrome only
pnpm test:e2e:screenshots:chrome

# Update Chrome snapshots locally
pnpm test:e2e:screenshots:chrome:update

# Firefox only
pnpm test:e2e:screenshots:firefox

# Update Firefox snapshots locally
pnpm test:e2e:screenshots:firefox:update

```

## Best Practices

1. Keep setup focused and deterministic
2. Prefer Page Objects for complex interactions
3. Use stable data-test-id selectors
4. Keep snapshots small and scenario-specific
