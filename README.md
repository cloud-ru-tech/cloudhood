![Cloudhood](https://github.com/cloud-ru-tech/cloudhood/assets/24465747/0a026d8b-be14-4f1f-9be3-d4e6056aea20)

<a href="https://chrome.google.com/webstore/detail/cloudhood/hohljodjndmmaiedadcdmnelgdfnbfgp"><img alt="Chrome Web Store Rating" src="https://img.shields.io/chrome-web-store/rating/hohljodjndmmaiedadcdmnelgdfnbfgp?label=Chrome%20Web%20Store%20Rating"></a>
<a href="https://chrome.google.com/webstore/detail/cloudhood/hohljodjndmmaiedadcdmnelgdfnbfgp"><img alt="Chrome Web Store Users" src="https://img.shields.io/chrome-web-store/users/hohljodjndmmaiedadcdmnelgdfnbfgp?label=Chrome%20Web%20Store%20Users&color=%2325c2a0"></a>
<a href="https://chrome.google.com/webstore/detail/cloudhood/hohljodjndmmaiedadcdmnelgdfnbfgp"><img alt="Chrome Web Store Version" src="https://img.shields.io/chrome-web-store/v/hohljodjndmmaiedadcdmnelgdfnbfgp?label=Chrome%20Web%20Store%20Version"></a>
<a href="https://github.com/cloud-ru-tech/cloudhood/releases"><img alt="GitHub Release Date" src="https://img.shields.io/github/release-date/cloud-ru-tech/cloudhood?label=Release%20Date" /></a>

## 🌐 Language / Язык

- **[English](README.md)** (International version)
- **[Русский](README.ru.md)** (Russian version)

---

## About Cloudhood

Cloudhood is a powerful browser extension that allows users to control HTTP request headers that will be embedded in all web requests. Built with modern web technologies and following Feature-Sliced Design architecture principles.

### Key Features

- **Header Management**: Create, edit, and manage custom HTTP headers
- **Profile System**: Organize headers into reusable profiles
- **Cross-Browser Support**: Works on Chrome and Firefox
- **Import/Export**: Share profiles between devices and team members
- **Real-time Application**: Headers are applied instantly to web requests
- **Modern UI**: Clean, intuitive interface built with React and TypeScript

### How It Works

Header overrides are managed through a Chrome extension popup (React application), stored in browser local storage, and applied to upstream page requests using Chrome's Declarative Net Request API.

## 📚 Documentation

- **[Project Map](PROJECT_MAP.md)** - Detailed architecture and project structure overview
- **[Architecture Diagrams](ARCHITECTURE_DIAGRAMS.md)** - Visual schemas of architecture and data flows
- **[Developer Guide](DEVELOPER_GUIDE.md)** - Complete developer handbook

## 🚀 Quick Start

### Prerequisites

- Node.js >= 20.0.0
- pnpm >= 10.10.0
- Chrome or Firefox browser

### Installation

```bash
# Clone the repository
git clone https://github.com/cloud-ru-tech/cloudhood.git
cd cloudhood

# Install dependencies
pnpm install

# Start development server for Chrome
pnpm dev:chrome

# Start development server for Firefox
pnpm dev:firefox
```

### Loading the Extension

#### Chrome
1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked extension"
4. Select the `build/chrome` directory

#### Firefox
1. Open `about:debugging`
2. Click "This Firefox"
3. Click "Load Temporary Add-on"
4. Select `build/firefox/manifest.json`

## 🧪 Testing

### Unit Tests

```bash
# Run unit tests
pnpm test:unit

# Run with coverage
pnpm test:unit --coverage
```

### E2E Tests

```bash
# Install browsers (first time only)
pnpm exec playwright install

# Run E2E tests
pnpm test:e2e

# Run in CI mode
pnpm test:e2e:ci
```

For E2E tests, always import the test fixtures:

```typescript
import { expect, test } from './fixtures';
```

## 🛠️ Development

### Development Commands

```bash
# Chrome development with hot reload
pnpm dev:chrome

# Firefox development with hot reload
pnpm dev:firefox

# Build for Chrome
pnpm build:chromium

# Build for Firefox
pnpm build:firefox

# Build for all browsers
pnpm build

# Lint code
pnpm lint
```

### Local Build

For local Firefox builds, set the `FIREFOX_EXTENSION_ID` environment variable:

```bash
FIREFOX_EXTENSION_ID=your-extension-id@example.com pnpm run build:firefox
```

**Note**: This variable is not needed for GitHub Actions builds as it's automatically set from secrets.

### Architecture

The project follows **Feature-Sliced Design** architecture:

```
src/
├── app/          # Application initialization
├── pages/        # Pages (widget composition)
├── widgets/      # High-level UI blocks
├── features/     # User-facing features
├── entities/     # Business entities
└── shared/       # Shared resources
```

### Technology Stack

- **Frontend**: React 18 + TypeScript
- **State Management**: Effector
- **UI Library**: @snack-uikit (Cloud.ru internal library)
- **Build Tool**: Vite
- **Testing**: Vitest + Playwright
- **Architecture**: Feature-Sliced Design

## 📦 Building Extensions

### Chrome Extension

```bash
pnpm build:chromium
```

The extension will be built in the `build/chrome` directory.

### Firefox Extension

```bash
pnpm build:firefox
```

The extension will be built in the `build/firefox` directory.

### Firefox Sources Archive

```bash
npm run build:firefox-sources
```

Creates a ZIP archive with source code required for Firefox Add-ons submission. Mozilla requires source code submission for extensions that use build tools or minification.

## 🚀 Releasing

We use GitHub Actions to automate the release process. The workflow:

1. Bumps version based on commit messages
2. Builds extensions for Chrome and Firefox
3. Creates ZIP archives for both platforms
4. Creates source code archive for Firefox Add-ons submission
5. Publishes to Chrome Web Store and Firefox Add-ons (with source code)
6. Creates a GitHub Release with both extension packages

See [RELEASE_SETUP.md](RELEASE_SETUP.md) for details on configuring the release automation.

## 🤝 Contributing

### Development Process

1. Create a feature branch from `main`
2. Make changes following FSD architecture
3. Add tests for new functionality
4. Run `pnpm lint` and fix any issues
5. Run `pnpm test:unit && pnpm test:e2e`
6. Create a Pull Request

### Code Standards

- Use TypeScript strictly
- Follow Feature-Sliced Design architecture
- Add comments for complex logic
- Use Effector for state management
- Write tests for new functionality

### Commits

Use conventional commits:

```
feat: add profile export functionality
fix: resolve header saving issue
docs: update documentation
test: add tests for utilities
```

## 🔗 Links

- **Chrome Web Store**: [Install Cloudhood](https://chrome.google.com/webstore/detail/cloudhood/hohljodjndmmaiedadcdmnelgdfnbfgp)
- **Firefox Add-ons**: [Install Cloudhood](https://addons.mozilla.org/en-US/firefox/addon/cloudhood/)
- **GitHub Releases**: [Latest Releases](https://github.com/cloud-ru-tech/cloudhood/releases)

## 📄 License

[Apache License 2.0](LICENSE)

---

## 🏢 About Cloud.ru

Cloudhood is developed by [Cloud.ru](https://cloud.ru/) - a leading Russian cloud provider offering comprehensive cloud solutions and services.

**Made with ❤️ by the Cloud.ru team**