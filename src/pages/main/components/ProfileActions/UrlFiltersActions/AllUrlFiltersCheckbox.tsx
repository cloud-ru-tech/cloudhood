import { useUnit } from 'effector-react';

import { Checkbox } from '@snack-uikit/toggles';

import { $isPaused } from '#entities/is-paused/model';
import { $isAllUrlFiltersEnabled, toggleAllProfileUrlFilters } from '#features/toggle-all-url-filters/model';

export function AllUrlFiltersCheckbox() {
  const { isAllUrlFiltersEnabled, isPaused, onToggleAll } = useUnit({
    isAllUrlFiltersEnabled: $isAllUrlFiltersEnabled,
    isPaused: $isPaused,
    onToggleAll: toggleAllProfileUrlFilters,
  });

  return (
    <Checkbox
      disabled={isPaused}
      checked={isAllUrlFiltersEnabled}
      onChange={onToggleAll}
      data-test-id='all-url-filters-checkbox'
    />
  );
}
