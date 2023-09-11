type SetIconBadgeParams = {
  isPaused: boolean;
  activeRulesCount: number;
};

export async function setIconBadge({ isPaused, activeRulesCount }: SetIconBadgeParams) {
  const iconPath = isPaused ? 'paused-icon-38.png' : 'main-icon-38.png';
  const badgeText = !isPaused && activeRulesCount > 0 ? activeRulesCount.toString() : '';

  await chrome.action.setIcon({ path: iconPath });
  await chrome.action.setBadgeText({ text: badgeText });
}
