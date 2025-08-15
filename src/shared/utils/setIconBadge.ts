import browser from 'webextension-polyfill';

import { browserAction } from './browserAPI';
import { logger } from './logger';

type SetIconBadgeParams = {
  isPaused: boolean;
  activeRulesCount: number;
};

export async function setIconBadge({ isPaused, activeRulesCount }: SetIconBadgeParams) {
  const iconPath = isPaused ? 'img/paused-icon-38.png' : 'img/main-icon-38.png';
  const badgeText = !isPaused && activeRulesCount > 0 ? activeRulesCount.toString() : '';

  // Логируем информацию о расширении
  logger.debug('Extension info:', {
    id: browser.runtime.id,
    getURL: browser.runtime.getURL(''),
    iconPath,
    badgeText,
    isPaused,
    activeRulesCount
  });

  logger.debug('Setting icon badge:', { isPaused, activeRulesCount, iconPath, badgeText });

  try {
    // Используем относительный путь к иконке
    logger.debug('Using relative icon path:', iconPath);
    await browserAction.setIcon({ path: iconPath });
    await browserAction.setBadgeText({ text: badgeText });
    logger.debug('Icon badge set successfully');
  } catch (err) {
    logger.error('Error setting icon badge:', err);
    logger.error('Error details:', {
      iconPath,
      badgeText,
      isPaused,
      activeRulesCount,
      errorMessage: err instanceof Error ? err.message : String(err),
    });
  }
}
