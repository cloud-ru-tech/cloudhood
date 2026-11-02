import browser from 'webextension-polyfill';

import { browserAction } from './browserAPI';
import { logger } from './logger';

type SetIconBadgeParams = {
  isPaused: boolean;
  activeRulesCount: number;
  /** When true, badge background turns orange to warn that some DNR rules could not be applied */
  hasDnrMismatch?: boolean;
};

const BADGE_API_TIMEOUT_MS = 1000;

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`timed out after ${timeoutMs}ms`)), timeoutMs);
    promise.then(
      value => {
        clearTimeout(timer);
        resolve(value);
      },
      error => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

export async function setIconBadge({ isPaused, activeRulesCount, hasDnrMismatch = false }: SetIconBadgeParams) {
  const iconPath = isPaused ? 'img/paused-icon-38.png' : 'img/main-icon-38.png';
  const badgeText = !isPaused && activeRulesCount > 0 ? activeRulesCount.toString() : '';
  const badgeColor = hasDnrMismatch ? '#f59e0b' : '#ffffff';

  // Log extension info
  logger.debug('Extension info:', {
    id: browser.runtime.id,
    getURL: browser.runtime.getURL(''),
    iconPath,
    badgeText,
    isPaused,
    activeRulesCount,
    hasDnrMismatch,
  });

  logger.debug('Setting icon badge:', { isPaused, activeRulesCount, iconPath, badgeText, hasDnrMismatch });

  try {
    // In Chrome Manifest V3, use an object with icon sizes.
    // One shared timeout: Firefox can leave action.setIcon pending forever, and a hung call
    // must not keep the DNR apply lock or be retried.
    const iconDetails = {
      path: {
        38: iconPath,
      },
    };

    logger.debug('Using icon details:', iconDetails);

    await withTimeout(
      Promise.all([
        browserAction.setIcon(iconDetails),
        browserAction.setBadgeText({ text: badgeText }),
        browserAction.setBadgeBackgroundColor({ color: badgeColor }),
      ]),
      BADGE_API_TIMEOUT_MS,
    );
    logger.debug('Icon badge set successfully');
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error('Error setting icon badge:', err);
    logger.error('Error details:', {
      iconPath,
      badgeText,
      isPaused,
      activeRulesCount,
      errorMessage: message,
    });

    if (message.startsWith('timed out')) {
      return;
    }

    try {
      logger.debug('Trying fallback with simple path:', iconPath);
      await withTimeout(
        Promise.all([browserAction.setIcon({ path: iconPath }), browserAction.setBadgeText({ text: badgeText })]),
        BADGE_API_TIMEOUT_MS,
      );
      logger.debug('Icon badge set successfully with fallback');
    } catch (fallbackErr) {
      logger.error('Fallback also failed:', fallbackErr);
    }
  }
}
