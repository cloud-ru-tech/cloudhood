import { useUnit } from 'effector-react';

import { Checkbox } from '@snack-uikit/toggles';

import { $isPaused } from '#entities/is-paused/model';
import { $isAllCookiesEnabled, toggleAllProfileRequestCookies } from '#features/toggle-all-request-cookies/model';

export function AllRequestCookiesCheckbox() {
  const { isAllEnabled, isPaused, onToggleAll } = useUnit({
    isAllEnabled: $isAllCookiesEnabled,
    isPaused: $isPaused,
    onToggleAll: toggleAllProfileRequestCookies,
  });

  return (
    <Checkbox
      data-test-id='all-request-cookies-checkbox'
      disabled={isPaused}
      checked={isAllEnabled}
      onChange={onToggleAll}
    />
  );
}
