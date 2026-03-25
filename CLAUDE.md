# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Cloudhood is a cross-browser extension (Chrome & Firefox) for managing custom HTTP request headers. Users create profiles containing headers and URL filters, which are applied to web requests via the Declarative Net Request API.

## Commands

```bash
# Development
pnpm dev:chrome              # Chrome dev with hot reload
pnpm dev:firefox             # Firefox dev with file watch

# Build
pnpm build                   # Build both browsers
pnpm build:chromium          # Chrome only
pnpm build:firefox           # Firefox only

# Testing
pnpm test:unit               # Unit tests (Vitest)
pnpm test:e2e                # E2E tests interactive (Playwright)
pnpm test:e2e:ci             # E2E tests in CI mode
pnpm test:e2e:screenshots    # Visual regression tests
pnpm test:e2e:screenshots:docker  # Visual regression in Docker (used in CI)

# Linting
pnpm lint                    # ESLint
pnpm lint:css                # Stylelint
```

Run a single unit test file: `pnpm test:unit src/shared/utils/__tests__/formatHeaders.test.ts`

Run a single E2E test: `pnpm test:e2e tests/e2e/some-test.spec.ts`

## Architecture

### Feature-Sliced Design (FSD)

The codebase follows FSD with strict layer imports — each layer can only import from layers below it:

```
app → pages → widgets → features → entities → shared
```

### Path Aliases

TypeScript path aliases map to FSD layers: `#app`, `#pages/*`, `#widgets/*`, `#features/*`, `#entities/*`, `#shared/*`. Defined in `tsconfig.json`.

### State Management — Effector

All state is managed with **Effector** (stores, events, effects, `sample`). Each entity/feature has a `model/` directory containing Effector units. Data persists to `browser.storage` via effects.

### Key Domain Model

A **Profile** (`src/entities/request-profile/types.ts`) contains:
- `requestHeaders: RequestHeader[]` — name/value pairs applied to matching requests
- `urlFilters: UrlFilter[]` — URL patterns determining which requests get headers

Headers are applied via Declarative Net Request in `src/shared/utils/setBrowserHeaders.ts`.

### Browser Compatibility

- `webextension-polyfill` wraps Chrome/Firefox API differences
- `src/shared/utils/browserAPI.ts` provides further abstraction (action API v2/v3 fallback)
- Separate manifests: `manifest.chromium.json`, `manifest.firefox.json`
- Build output goes to `build/chrome/` and `build/firefox/`

### Build System

Vite with two build targets:
1. **Popup** — React SPA (entry: `src/index.tsx`)
2. **Background** — Service worker (entry: `src/background.ts`, config: `vite.background.config.ts`)

The `BROWSER` env var (`chrome` | `firefox`) controls which manifest and build output are used.

### UI Components

Uses `@snack-uikit/*` component library with `@emotion/styled` for CSS-in-JS styling.

## Code Style

- Prettier: 2-space indent, 120 print width, single quotes, trailing commas
- ESLint config from `@cloud-ru/eslint-config` with `eslint-plugin-effector`
- Commit messages validated by `@cloud-ru/ft-config-commit-message` (conventional commits)
- Pre-commit hooks via Husky + lint-staged

## Tech Stack

- React 18, TypeScript (strict), Vite, Effector
- pnpm (>=10), Node.js (>=20)
- Playwright (E2E), Vitest (unit), jsdom
