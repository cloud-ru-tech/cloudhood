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

  // Log extension info
  logger.debug('Extension info:', {
    id: browser.runtime.id,
    getURL: browser.runtime.getURL(''),
    iconPath,
    badgeText,
    isPaused,
    activeRulesCount,
  });

  logger.debug('Setting icon badge:', { isPaused, activeRulesCount, iconPath, badgeText });

  try {
    // In Chrome Manifest V3, use an object with icon sizes
    const iconDetails = {
      path: {
        38: iconPath,
      },
    };

    logger.debug('Using icon details:', iconDetails);

    await browserAction.setIcon(iconDetails);
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

    // Fallback: try using a simple path
    try {
      logger.debug('Trying fallback with simple path:', iconPath);
      await browserAction.setIcon({ path: iconPath });
      await browserAction.setBadgeText({ text: badgeText });
      logger.debug('Icon badge set successfully with fallback');
    } catch (fallbackErr) {
      logger.error('Fallback also failed:', fallbackErr);
      // As a last resort, set the badge text without an icon
      try {
        await browserAction.setBadgeText({ text: badgeText });
        logger.debug('Badge text set without icon');
      } catch (textErr) {
        logger.error('Failed to set badge text:', textErr);
      }
    }
  }
}
