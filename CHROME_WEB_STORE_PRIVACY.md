# Chrome Web Store Privacy Practices

Use these values in the Chrome Web Store Developer Dashboard for Cloudhood.

## Single Purpose

Cloudhood lets developers create local profiles of HTTP request headers and URL filters, then apply those headers to matching browser requests for testing and development.

## Permission Justifications

### storage

Stores user-created header profiles, URL filters, selected profile, pause state, and UI settings locally in the browser.

### declarativeNetRequest

Adds or modifies outgoing request headers according to rules created by the user.

### declarativeNetRequestFeedback

Reads extension-managed dynamic rules to keep header modification behavior consistent and verify applied rules.

### Host permissions

Allows user-created header rules to apply to matching websites, including all websites when the user has not limited a profile to specific URL filters.

## Remote Code

Select: No, this extension does not use remote code.

## User Data Disclosure

Select no user data categories.

Cloudhood stores user-created profiles, request headers, URL filters, selected profile, pause state, and UI settings locally in the user's browser. This data is not collected by Cloudhood, Cloud.ru, or any developer-operated server.

Do not select authentication information, web browsing activity, personally identifiable information, health information, financial and payment information, location data, personal communications, or website content unless the extension behavior changes to collect or transmit those categories outside the user's local browser.

## Limited Use Certification

Select all required confirmations:

- Cloudhood does not sell or transfer user data except in allowed situations.
- Cloudhood does not use or transfer user data for purposes unrelated to the extension's core functionality.
- Cloudhood does not use or transfer user data to determine creditworthiness or for lending purposes.

## Privacy Policy URL

Use the public URL for `PRIVACY_POLICY.md` from the default branch:

https://github.com/cloud-ru-tech/cloudhood/blob/main/PRIVACY_POLICY.md
