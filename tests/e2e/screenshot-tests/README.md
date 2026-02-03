# CloudHood E2E Screenshot Tests

## Overview

This directory contains the scalable architecture for visual regression testing of the CloudHood browser extension with Playwright.

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
# One command: builds Chrome + Firefox and updates snapshots in Docker
pnpm test:e2e:screenshots:generate
```

```bash
# Verifies current snapshots without updating them
pnpm test:e2e:screenshots:check
```

### Local verification (Docker, matches CI)

```bash
# One command: builds Chrome + Firefox and checks snapshots in Docker
pnpm test:e2e:screenshots:check
```

### Local runs

```bash
# All screenshot tests
pnpm test:e2e:screenshots

# Update snapshots
pnpm test:e2e:screenshots:update

# Chrome only
pnpm test:e2e:screenshots:chrome

# Firefox only
pnpm test:e2e:screenshots:firefox
```

## Best Practices

1. Keep setup focused and deterministic
2. Prefer Page Objects for complex interactions
3. Use stable data-test-id selectors
4. Keep snapshots small and scenario-specific
