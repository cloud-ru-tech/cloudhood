import type { Profile } from '#entities/request-profile/types';
import { validateHeader } from '#shared/utils/headers';
import { isApplyableResponseOverride, normalizeStoredResponseOverrides } from '#shared/utils/responseOverrides';

export function resolveProfileActionsTab(profile: Profile | undefined): 'headers' | 'response-overrides' {
  if (!profile) {
    return 'headers';
  }

  const hasActiveHeaders = profile.requestHeaders.some(
    header => !header.disabled && validateHeader(header.name, header.value),
  );

  if (hasActiveHeaders) {
    return 'headers';
  }

  const hasActiveOverrides =
    profile.responseOverridesDisabled !== true &&
    normalizeStoredResponseOverrides(profile.responseOverrides).some(isApplyableResponseOverride);

  return hasActiveOverrides ? 'response-overrides' : 'headers';
}
