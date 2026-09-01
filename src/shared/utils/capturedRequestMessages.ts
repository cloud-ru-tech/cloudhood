import {
  CLOUDHOOD_REQUEST_CAPTURE_SETTLED,
  CLOUDHOOD_REQUEST_CAPTURE_STARTED,
  ServiceWorkerEvent,
} from '#shared/constants';
import { CapturedRequestEvent } from '#shared/types/capturedRequest';
import { ResponseOverrideHttpMethod } from '#shared/types/responseOverride';
import { parseCapturedRequestEvent } from '#shared/utils/capturedRequests';
import { isResponseOverrideHttpMethod } from '#shared/utils/responseOverrides';

export type RequestCaptureStartedPageMessage = {
  type: typeof CLOUDHOOD_REQUEST_CAPTURE_STARTED;
  id: string;
  url: string;
  method: ResponseOverrideHttpMethod;
  startedAt: number;
};

export type RequestCaptureCompletedPageMessage = {
  type: typeof CLOUDHOOD_REQUEST_CAPTURE_SETTLED;
  id: string;
  failed?: false;
  statusCode: number | null;
  responseBody: string | null;
};

export type RequestCaptureFailedPageMessage = {
  type: typeof CLOUDHOOD_REQUEST_CAPTURE_SETTLED;
  id: string;
  failed: true;
};

export type RequestCaptureSettledPageMessage = RequestCaptureCompletedPageMessage | RequestCaptureFailedPageMessage;

export type CapturedRequestsSessionStartedWorkerMessage = {
  type: typeof ServiceWorkerEvent.CapturedRequestsSessionStarted;
};

export type CapturedRequestEventsWorkerMessage = {
  type: typeof ServiceWorkerEvent.CapturedRequestEvents;
  events: CapturedRequestEvent[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function isRequestCaptureStartedPageMessage(value: unknown): value is RequestCaptureStartedPageMessage {
  return (
    isRecord(value) &&
    value.type === CLOUDHOOD_REQUEST_CAPTURE_STARTED &&
    typeof value.id === 'string' &&
    typeof value.url === 'string' &&
    typeof value.method === 'string' &&
    isResponseOverrideHttpMethod(value.method) &&
    typeof value.startedAt === 'number' &&
    Number.isFinite(value.startedAt)
  );
}

export function isRequestCaptureSettledPageMessage(value: unknown): value is RequestCaptureSettledPageMessage {
  if (!isRecord(value) || value.type !== CLOUDHOOD_REQUEST_CAPTURE_SETTLED || typeof value.id !== 'string') {
    return false;
  }

  if (value.failed === true) {
    return true;
  }

  if (value.statusCode !== null && (typeof value.statusCode !== 'number' || !Number.isInteger(value.statusCode))) {
    return false;
  }

  if (value.responseBody !== null && typeof value.responseBody !== 'string') {
    return false;
  }

  return true;
}

export function isCapturedRequestsSessionStartedWorkerMessage(
  value: unknown,
): value is CapturedRequestsSessionStartedWorkerMessage {
  return isRecord(value) && value.type === ServiceWorkerEvent.CapturedRequestsSessionStarted;
}

export function isCapturedRequestEventsWorkerMessage(value: unknown): value is CapturedRequestEventsWorkerMessage {
  if (!isRecord(value) || value.type !== ServiceWorkerEvent.CapturedRequestEvents || !Array.isArray(value.events)) {
    return false;
  }

  return value.events.every(event => parseCapturedRequestEvent(event) !== null);
}

export function toCapturedRequestEventFromPageMessage(
  message: RequestCaptureStartedPageMessage | RequestCaptureSettledPageMessage,
): CapturedRequestEvent {
  if (message.type === CLOUDHOOD_REQUEST_CAPTURE_STARTED) {
    return {
      kind: 'started',
      id: message.id,
      url: message.url,
      method: message.method,
      startedAt: message.startedAt,
    };
  }

  if (message.failed === true) {
    return { kind: 'failed', id: message.id };
  }

  return {
    kind: 'settled',
    id: message.id,
    statusCode: message.statusCode,
    responseBody: message.responseBody,
  };
}

export function parseCapturedRequestEventsFromUnknown(value: unknown): CapturedRequestEvent[] {
  if (!isRecord(value) || !Array.isArray(value.events)) {
    return [];
  }

  return value.events.flatMap(event => {
    const parsed = parseCapturedRequestEvent(event);
    return parsed ? [parsed] : [];
  });
}
