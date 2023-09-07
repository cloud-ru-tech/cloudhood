# Cloudhood

This extension allows users to control request headers that will be embedded in all requests in Chrome Browser, where each override contains the following properties:

* Header: Header key.
* Header Value: The value associated with the header key.

Header overrides are managed in a Chrome extension popup (a simple react app), stored in Chrome local storage, and applied to upstream page requests using the updateDynamicRules function of chrome's declarativeNetRequest dynamic request rules.
## Local Development

### Start Local Server

1. Run `npm install` to install the dependencies.
2. Run `npm start`
3. Download extension in Chrome:
   3.1. Open `chrome://extensions/` in the address bar
   3.2. Turn on `Developer mode`
   3.3. Click `Load unpacked extension`
   3.4. Select `build` directory.

## Packing

After developing your extension, run the command

```
npm run build
```

# License

[Apache License 2.0](LICENSE). 