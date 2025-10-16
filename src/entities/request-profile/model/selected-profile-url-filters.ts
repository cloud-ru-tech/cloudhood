import { combine } from "effector";

import { validateUrlFilter } from "#shared/utils/createUrlCondition";

import { $requestProfiles } from "./request-profiles";
import { $selectedRequestProfile } from "./selected-request-profile";

export const $selectedProfileUrlFilters = combine(
  $selectedRequestProfile,
  $requestProfiles,
  (selectedProfileId, profiles) => profiles.find(p => p.id === selectedProfileId)?.urlFilters ?? [],
  { skipVoid: false },
);

export const $selectedProfileActiveUrlFiltersCount = combine(
  $selectedProfileUrlFilters,
  headers => headers.filter(item => !item.disabled && validateUrlFilter(item.value).isValid).length,
  { skipVoid: false },
);