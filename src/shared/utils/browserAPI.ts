import browser from 'webextension-polyfill';

import { logger } from './logger';

/**
 * Determines whether the extension is running in Firefox
 */
export function isFirefox(): boolean {
  return browser.runtime.getURL('').startsWith('moz-extension://');
}

/**
 * API for working with the extension icon (action API in Manifest V3)
 */
export const browserAction = {
  /**
   * Set the badge background color
   */
  setBadgeBackgroundColor: (details: browser.Action.SetBadgeBackgroundColorDetailsType): Promise<void> => {
    logger.debug('Setting badge background color:', details);
    // In Manifest V3, both Chrome and Firefox use the action API
    if (browser.action) {
      return browser.action.setBadgeBackgroundColor(details);
    }
    // Fallback for older versions with browserAction (Manifest V2)
    if (browser.browserAction) {
      return browser.browserAction.setBadgeBackgroundColor(details);
    }
    throw new Error('Neither action nor browserAction API is available');
  },

  /**
   * Set the badge text
   */
  setBadgeText: (details: browser.Action.SetBadgeTextDetailsType): Promise<void> => {
    logger.debug('Setting badge text:', details);
    // In Manifest V3, both Chrome and Firefox use the action API
    if (browser.action) {
      return browser.action.setBadgeText(details);
    }
    // Fallback for older versions with browserAction (Manifest V2)
    if (browser.browserAction) {
      return browser.browserAction.setBadgeText(details);
    }
    throw new Error('Neither action nor browserAction API is available');
  },

  /**
   * Set the icon
   */
  setIcon: (details: browser.Action.SetIconDetailsType): Promise<void> => {
    logger.debug('Setting icon:', details);
    // In Manifest V3, both Chrome and Firefox use the action API
    if (browser.action) {
      return browser.action.setIcon(details);
    }
    // Fallback for older versions with browserAction (Manifest V2)
    if (browser.browserAction) {
      return browser.browserAction.setIcon(details);
    }
    throw new Error('Neither action nor browserAction API is available');
  },
};
