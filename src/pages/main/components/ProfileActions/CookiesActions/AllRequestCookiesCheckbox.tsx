import { useUnit } from 'effector-react';

import { Checkbox } from '@snack-uikit/toggles';

import { $isPaused } from '#entities/is-paused/model';
import { $isAllCookiesEnabled, toggleAllProfileRequestCookies } from '#features/toggle-all-request-cookies/model';

export function AllRequestCookiesCheckbox() {
  const { isAllEnabled, isPaused } = useUnit({ isAllEnabled: $isAllCookiesEnabled, isPaused: $isPaused });

  return (
    <Checkbox
      data-test-id='all-request-cookies-checkbox'
      disabled={isPaused}
      checked={isAllEnabled}
      onChange={toggleAllProfileRequestCookies}
    />
  );
}
