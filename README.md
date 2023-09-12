![Cloudhood](https://github.com/sbercloud/cloudhood/assets/24465747/b4b90013-0f79-4112-bf99-f6d8efafa185)

<a href="https://chrome.google.com/webstore/detail/cloudhood/hohljodjndmmaiedadcdmnelgdfnbfgp"><img alt="Chrome Web Store Rating" src="https://img.shields.io/chrome-web-store/rating/hohljodjndmmaiedadcdmnelgdfnbfgp?label=Chrome%20Web%20Store%20Rating"></a>
<a href="https://chrome.google.com/webstore/detail/cloudhood/hohljodjndmmaiedadcdmnelgdfnbfgp"><img alt="Chrome Web Store Users" src="https://img.shields.io/chrome-web-store/users/hohljodjndmmaiedadcdmnelgdfnbfgp?label=Chrome%20Web%20Store%20Users&color=%2325c2a0"></a>
<a href="https://github.com/sbercloud/cloudhood/releases"><img alt="GitHub Release Date" src="https://img.shields.io/github/release-date/sbercloud/cloudhood" /></a>

This extension allows users to control request headers that will be embedded in all requests in Chrome Browser, where each override contains the following properties:

- Header: Header key.
- Header Value: The value associated with the header key.

Header overrides are managed in a Chrome extension popup (a simple react app), stored in Chrome local storage, and applied to upstream page requests using the updateDynamicRules function of chrome's declarativeNetRequest dynamic request rules.

## Testing

You can get a test build for each pull-request in its comments. [Example](https://github.com/sbercloud/cloudhood/pull/1#issuecomment-1713810507).

## Local Development

### Start Local Server

1. Run `npm install` to install the dependencies.
1. Run `npm start`
1. Download extension in Chrome:
   - Open `chrome://extensions/` in the address bar
   - Turn on `Developer mode`
   - Click `Load unpacked extension`
   - Select `build` directory.

## Packing

After developing your extension, run the command

```
npm run build
```

## Release

The repository is configured with actions for automatic pre-releases and releases.

You don't need to do anything to create a pre-release: the pre-release will be built as soon as there are changes in the `main` branch.

To create a release you need to execute the following command in the terminal, having previously set a new tag instead of `v1.2.3`:

```
TAG=v1.2.3 && git tag $TAG && git push origin tag $TAG
```

# License

[Apache License 2.0](LICENSE).
