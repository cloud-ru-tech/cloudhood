import { useUnit } from 'effector-react';

import { Checkbox } from '@snack-uikit/toggles';

import { $isPaused } from '#entities/is-paused/model';
import { $isAllEnabled, toggleAllProfileRequestHeaders } from '#features/toggle-all-request-headers/model';

export function AllRequestHeadersCheckbox() {
  const { isAllEnabled, isPaused } = useUnit({ isAllEnabled: $isAllEnabled, isPaused: $isPaused });

  return <Checkbox disabled={isPaused} checked={isAllEnabled} onChange={toggleAllProfileRequestHeaders} />;
}
