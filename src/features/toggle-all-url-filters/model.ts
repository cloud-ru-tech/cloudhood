import { combine, createEvent, sample } from 'effector';

import { $selectedProfileUrlFilters } from '#entities/request-profile/model/selected-profile-url-filters';
import { selectedProfileUrlFiltersUpdated } from '#features/selected-profile-url-filters/update/model';

export const toggleAllProfileUrlFilters = createEvent<boolean>();

export const $isAllUrlFiltersEnabled = combine(
  $selectedProfileUrlFilters,
  urlFilters => urlFilters.length > 0 && urlFilters.every(filter => !filter.disabled),
  { skipVoid: false },
);

sample({
  clock: toggleAllProfileUrlFilters,
  source: $selectedProfileUrlFilters,
  fn: (urlFilters, enabled) => urlFilters.map(filter => ({ ...filter, disabled: !enabled })),
  target: selectedProfileUrlFiltersUpdated,
});
