import { useUnit } from 'effector-react';

import { Checkbox } from '@snack-uikit/toggles';

import { $isPaused } from '#entities/is-paused/model';
import { $isAllEnabled, toggleAllProfileResponseOverrides } from '#features/selected-profile-overrides/toggle/model';

export function AllOverridesCheckbox() {
  const [isPaused, isAllEnabled] = useUnit([$isPaused, $isAllEnabled]);

  return (
    <Checkbox
      data-test-id='response-overrides-all-checkbox'
      disabled={isPaused}
      checked={isAllEnabled}
      onChange={toggleAllProfileResponseOverrides}
    />
  );
}
