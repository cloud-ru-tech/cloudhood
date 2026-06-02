# Release Setup

[English](RELEASE_SETUP.md) | [Русский](RELEASE_SETUP.ru.md)

The `Release` GitHub Actions workflow publishes one shared application version to Chrome Web Store and Firefox Add-ons.

## Version Rules

The workflow calculates the next version from commits after the latest `v<major>.<minor>.<patch>` tag:

- `major`: a conventional commit with `!`, such as `feat!:`, or a commit body with `BREAKING CHANGE:`
- `minor`: a conventional `feat:` commit
- `patch`: any other set of changes

The calculated version is written to:

- `package.json`
- `manifest.chromium.json`
- `manifest.firefox.json`

The workflow creates a matching Git tag, for example `v1.9.1`, and a GitHub Release with versioned Chrome, Firefox, and Firefox sources archives. Release notes contain the commits since the previous release tag.

## Required Secrets

Configure these repository Actions secrets:

- `PAT`: SSH private key used to push the version commit and tag
- `CHROME_EXTENSION_ID`
- `CHROME_CLIENT_ID`
- `CHROME_CLIENT_SECRET`
- `CHROME_REFRESH_TOKEN`
- `CHROME_PUBLISH_TARGET`
- `FIREFOX_EXTENSION_ID`
- `FIREFOX_JWT_ISSUER`
- `FIREFOX_JWT_SECRET`

## Publish

Open **Actions**, select **Release**, and run the workflow from `main`. Only one release workflow runs at a time.
