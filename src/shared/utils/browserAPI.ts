import browser from 'webextension-polyfill';

import { logger } from './logger';

/**
 * Определяет, запущено ли расширение в Firefox
 */
export function isFirefox(): boolean {
  return browser.runtime.getURL('').startsWith('moz-extension://');
}

/**
 * API для работы с иконкой расширения (action API в Manifest V3)
 */
export const browserAction = {
  /**
   * Установить цвет фона значка
   */
  setBadgeBackgroundColor: (details: browser.Action.SetBadgeBackgroundColorDetailsType): Promise<void> => {
    logger.debug('Setting badge background color:', details);
    // В Manifest V3 и Chrome, и Firefox используют action API
    if (browser.action) {
      return browser.action.setBadgeBackgroundColor(details);
    }
    // Fallback для старых версий с browserAction (Manifest V2)
    if (browser.browserAction) {
      return browser.browserAction.setBadgeBackgroundColor(details);
    }
    throw new Error('Neither action nor browserAction API is available');
  },

  /**
   * Установить текст значка
   */
  setBadgeText: (details: browser.Action.SetBadgeTextDetailsType): Promise<void> => {
    logger.debug('Setting badge text:', details);
    // В Manifest V3 и Chrome, и Firefox используют action API
    if (browser.action) {
      return browser.action.setBadgeText(details);
    }
    // Fallback для старых версий с browserAction (Manifest V2)
    if (browser.browserAction) {
      return browser.browserAction.setBadgeText(details);
    }
    throw new Error('Neither action nor browserAction API is available');
  },

  /**
   * Установить иконку
   */
  setIcon: (details: browser.Action.SetIconDetailsType): Promise<void> => {
    logger.debug('Setting icon:', details);
    // В Manifest V3 и Chrome, и Firefox используют action API
    if (browser.action) {
      return browser.action.setIcon(details);
    }
    // Fallback для старых версий с browserAction (Manifest V2)
    if (browser.browserAction) {
      return browser.browserAction.setIcon(details);
    }
    throw new Error('Neither action nor browserAction API is available');
  },
};
