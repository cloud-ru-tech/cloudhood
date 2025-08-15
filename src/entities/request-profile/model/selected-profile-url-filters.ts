import { combine } from "effector";

import { $requestProfiles } from "./request-profiles";
import { $selectedRequestProfile } from "./selected-request-profile";

export const $selectedProfileUrlFilters = combine(
  $selectedRequestProfile,
  $requestProfiles,
  (selectedProfileId, profiles) => profiles.find(p => p.id === selectedProfileId)?.urlFilters ?? [],
  { skipVoid: false },
);
