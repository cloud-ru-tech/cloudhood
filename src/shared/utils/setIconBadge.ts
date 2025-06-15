import { browserAction } from './browserAPI';
import { logger } from './logger';

type SetIconBadgeParams = {
  isPaused: boolean;
  activeRulesCount: number;
};

export async function setIconBadge({ isPaused, activeRulesCount }: SetIconBadgeParams) {
  const iconPath = isPaused ? 'paused-icon-38.png' : 'main-icon-38.png';
  const badgeText = !isPaused && activeRulesCount > 0 ? activeRulesCount.toString() : '';
  logger.debug('Setting icon badge:', { isPaused, activeRulesCount, iconPath, badgeText });

  try {
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
