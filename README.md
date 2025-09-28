![Cloudhood](https://github.com/cloud-ru-tech/cloudhood/assets/24465747/0a026d8b-be14-4f1f-9be3-d4e6056aea20)

<a href="https://chrome.google.com/webstore/detail/cloudhood/hohljodjndmmaiedadcdmnelgdfnbfgp"><img alt="Chrome Web Store Rating" src="https://img.shields.io/chrome-web-store/rating/hohljodjndmmaiedadcdmnelgdfnbfgp?label=Chrome%20Web%20Store%20Rating"></a>
<a href="https://chrome.google.com/webstore/detail/cloudhood/hohljodjndmmaiedadcdmnelgdfnbfgp"><img alt="Chrome Web Store Users" src="https://img.shields.io/chrome-web-store/users/hohljodjndmmaiedadcdmnelgdfnbfgp?label=Chrome%20Web%20Store%20Users&color=%2325c2a0"></a>
<a href="https://chrome.google.com/webstore/detail/cloudhood/hohljodjndmmaiedadcdmnelgdfnbfgp"><img alt="Chrome Web Store Version" src="https://img.shields.io/chrome-web-store/v/hohljodjndmmaiedadcdmnelgdfnbfgp?label=Chrome%20Web%20Store%20Version"></a>
<a href="https://github.com/cloud-ru-tech/cloudhood/releases"><img alt="GitHub Release Date" src="https://img.shields.io/github/release-date/cloud-ru-tech/cloudhood?label=Release%20Date" /></a>

This extension allows users to control request headers that will be embedded in all requests in Chrome Browser, where each override contains the following properties:

- Header: Header key.
- Header Value: The value associated with the header key.

Header overrides are managed in a Chrome extension popup (a simple react app), stored in Chrome local storage, and applied to upstream page requests using the updateDynamicRules function of chrome's declarativeNetRequest dynamic request rules.

## Development

### Local Build

For local Firefox builds, set the `FIREFOX_EXTENSION_ID` environment variable:

```bash
FIREFOX_EXTENSION_ID=your-extension-id@example.com pnpm run build:firefox
```

**Note**: This variable is not needed for GitHub Actions builds as it's automatically set from secrets.

## Testing

You can get a test build for each pull-request in its comments. [Example](https://github.com/cloud-ru-tech/cloudhood/pull/1#issuecomment-1713810507).

### E2E Testing

For E2E tests, always import the test fixtures:

```typescript
import { expect, test } from './fixtures';
```

Before running E2E tests for the first time, install the required browsers:

```bash
pnpm exec playwright install
```

Run E2E tests with:

```bash
pnpm test:e2e
```

## Local Development

### Development Server with Hot Reload

For convenient development with automatic reload, use the following commands:

#### Chrome Development (with hot reload)

```bash
pnpm dev:chrome
```

#### Firefox Development (with hot reload)

```bash
pnpm dev:firefox
```

These commands will start a dev server that will automatically update files in the `build` directory when source code changes.

### Start Local Server (legacy method)

1. Run `pnpm install` to install the dependencies.
1. Run `pnpm start`
1. Download extension in Chrome:
   - Open `chrome://extensions/` in the address bar
   - Turn on `Developer mode`
   - Click `Load unpacked extension`
   - Select `build` directory.

## Development for different browsers

### Chrome Development

```bash
pnpm dev:chrome    # with hot reload (recommended)
```

### Firefox Development

```bash
pnpm dev:firefox    # with hot reload (recommended)
```

## Building Extensions

### Build Chrome Extension

```bash
pnpm build:chromium
```

The extension will be built in the `build/chrome` directory.

### Build Firefox Extension

```bash
pnpm build:firefox
```

The extension will be built in the `build/firefox` directory.

### Build Firefox Sources Archive

```bash
npm run build:firefox-sources
```

Creates a ZIP archive with source code required for Firefox Add-ons submission. Mozilla requires source code submission for extensions that use build tools or minification.

### Build Both Extensions

```bash
pnpm build
```

## Releasing

We use GitHub Actions to automate the release process. The workflow:

1. Bumps version based on commit messages
2. Builds extensions for Chrome and Firefox
3. Creates ZIP archives for both platforms
4. Creates source code archive for Firefox Add-ons submission
5. Publishes to Chrome Web Store and Firefox Add-ons (with source code)
6. Creates a GitHub Release with both extension packages

See [RELEASE_SETUP.md](RELEASE_SETUP.md) for details on configuring the release automation.

## Packing

After developing your extension, run the command

```
pnpm run build
```

## Releases

The repository is configured with actions for automatic releases to Github.

# License

[Apache License 2.0](LICENSE).
