import browser from 'webextension-polyfill';

/**
 * Utilities for working with Content Security Policy
 */

/**
 * Determines the current browser
 */
export function getBrowserType(): 'chrome' | 'firefox' | 'unknown' {
  if (!browser) {
    return 'unknown';
  }

  const userAgent = navigator.userAgent.toLowerCase();

  if (userAgent.includes('firefox')) {
    return 'firefox';
  }

  if (userAgent.includes('chrome') || userAgent.includes('chromium')) {
    return 'chrome';
  }

  return 'chrome';
}

/**
 * Gets a nonce from the meta tag or returns a fixed value
 */
export function getStyleNonce(): string {
  const FIXED_NONCE = 'cloudhood-extension-style-nonce';

  let meta = document.querySelector('meta[name="style-nonce"]') as HTMLMetaElement;

  if (!meta) {
    meta = document.createElement('meta');
    meta.name = 'style-nonce';
    meta.content = FIXED_NONCE;
    document.head.appendChild(meta);
  } else if (meta.content !== FIXED_NONCE) {
    meta.content = FIXED_NONCE;
  }

  return FIXED_NONCE;
}

export function supportsCSPNonce(): boolean {
  const browserType = getBrowserType();

  return browserType === 'chrome' || browserType === 'firefox';
}
