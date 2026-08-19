import {
  CLOUDHOOD_RESPONSE_OVERRIDE_APPLY_ERROR_MESSAGE,
  CLOUDHOOD_RESPONSE_OVERRIDES_MESSAGE,
  ServiceWorkerEvent,
} from '#shared/constants';
import { ResponseOverride } from '#shared/types/responseOverride';
import { parseProfileResponseOverridesSnapshot } from '#shared/utils/responseOverrides';

export type ResponseOverridesPageMessage = {
  type: typeof CLOUDHOOD_RESPONSE_OVERRIDES_MESSAGE;
  overrides: ResponseOverride[];
};

export type ResponseOverrideApplyErrorPageMessage = {
  type: typeof CLOUDHOOD_RESPONSE_OVERRIDE_APPLY_ERROR_MESSAGE;
  overrideId: number;
  reason: string;
};

export type ResponseOverrideApplyErrorWorkerMessage = {
  type: typeof ServiceWorkerEvent.ResponseOverrideApplyError;
  profileId: string;
  overrideId: number;
  reason: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function isResponseOverridesPageMessage(value: unknown): value is ResponseOverridesPageMessage {
  if (!isRecord(value) || value.type !== CLOUDHOOD_RESPONSE_OVERRIDES_MESSAGE || !Array.isArray(value.overrides)) {
    return false;
  }

  return value.overrides.every(item => {
    const snapshot = parseProfileResponseOverridesSnapshot({ id: 'page', responseOverrides: [item] });
    return snapshot !== null && snapshot.responseOverrides.length === 1;
  });
}

export function isResponseOverrideApplyErrorPageMessage(value: unknown): value is ResponseOverrideApplyErrorPageMessage {
  return (
    isRecord(value) &&
    value.type === CLOUDHOOD_RESPONSE_OVERRIDE_APPLY_ERROR_MESSAGE &&
    typeof value.overrideId === 'number' &&
    typeof value.reason === 'string'
  );
}

export function isResponseOverrideApplyErrorWorkerMessage(
  value: unknown,
): value is ResponseOverrideApplyErrorWorkerMessage {
  return (
    isRecord(value) &&
    value.type === ServiceWorkerEvent.ResponseOverrideApplyError &&
    typeof value.profileId === 'string' &&
    typeof value.overrideId === 'number' &&
    typeof value.reason === 'string'
  );
}

export function isServiceWorkerReloadMessage(value: unknown): value is ServiceWorkerEvent.Reload {
  return value === ServiceWorkerEvent.Reload;
}
