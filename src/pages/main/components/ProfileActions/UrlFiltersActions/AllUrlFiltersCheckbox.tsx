import { useUnit } from 'effector-react';

import { Checkbox } from '@cloud-ru/ds-toggles';

import { $isPaused } from '#entities/is-paused/model';
import { $isAllUrlFiltersEnabled, toggleAllProfileUrlFilters } from '#features/toggle-all-url-filters/model';

export function AllUrlFiltersCheckbox() {
  const { isAllUrlFiltersEnabled, isPaused, toggleAll } = useUnit({
    isAllUrlFiltersEnabled: $isAllUrlFiltersEnabled,
    isPaused: $isPaused,
    toggleAll: toggleAllProfileUrlFilters,
  });

  return (
    <Checkbox
      disabled={isPaused}
      checked={isAllUrlFiltersEnabled}
      onChange={toggleAll}
      data-test-id='all-url-filters-checkbox'
    />
  );
}
