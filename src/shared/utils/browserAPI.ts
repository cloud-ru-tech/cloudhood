import browser from 'webextension-polyfill';

import { logger } from './logger';

/**
 * Определяет, запущено ли расширение в Firefox
 */
export function isFirefox(): boolean {
  return browser.runtime.getURL('').startsWith('moz-extension://');
}

/**
 * API для работы с иконкой расширения (action в Chrome, browserAction в Firefox)
 */
export const browserAction = {
  /**
   * Установить цвет фона значка
   */
  setBadgeBackgroundColor: (details: browser.Action.SetBadgeBackgroundColorDetailsType): Promise<void> => {
    logger.debug('Setting badge background color:', details);
    if (isFirefox()) {
      // Firefox использует browserAction (Manifest V2)
      // browserAction не определен в типах webextension-polyfill для Manifest V3
      return browser.browserAction.setBadgeBackgroundColor(details);
    }
    // Chrome использует action (Manifest V3)
    // Если action не определен, пробуем использовать browserAction для обратной совместимости
    if (browser.action) {
      return browser.action.setBadgeBackgroundColor(details);
    }
    // fallback для старых версий Chrome с browserAction вместо action
    return browser.browserAction.setBadgeBackgroundColor(details);
  },

  /**
   * Установить текст значка
   */
  setBadgeText: (details: browser.Action.SetBadgeTextDetailsType): Promise<void> => {
    logger.debug('Setting badge text:', details);
    if (isFirefox()) {
      // browserAction API используется в Firefox с Manifest V2
      return browser.browserAction.setBadgeText(details);
    }
    if (browser.action) {
      return browser.action.setBadgeText(details);
    }
    // используется для совместимости со старыми версиями Chrome
    return browser.browserAction.setBadgeText(details);
  },

  /**
   * Установить иконку
   */
  setIcon: (details: browser.Action.SetIconDetailsType): Promise<void> => {
    logger.debug('Setting icon:', details);
    if (isFirefox()) {
      return browser.browserAction.setIcon(details);
    }
    if (browser.action) {
      return browser.action.setIcon(details);
    }
    return browser.browserAction.setIcon(details);
  },
};
