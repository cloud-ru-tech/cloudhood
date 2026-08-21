import browser from 'webextension-polyfill';

import {
  BrowserStorageKey,
  CAPTURED_REQUESTS_BRIDGE_BATCH_MS,
  CLOUDHOOD_RESPONSE_OVERRIDES_MESSAGE,
  ServiceWorkerEvent,
} from '#shared/constants';
import { CapturedRequestEvent } from '#shared/types/capturedRequest';
import { ResponseOverride } from '#shared/types/responseOverride';
import {
  isRequestCaptureSettledPageMessage,
  isRequestCaptureStartedPageMessage,
  toCapturedRequestEventFromPageMessage,
} from '#shared/utils/capturedRequestMessages';
import {
  isResponseOverrideApplyErrorPageMessage,
  ResponseOverridesPageMessage,
} from '#shared/utils/responseOverrideMessages';
import {
  computeActiveResponseOverrides,
  parseIsPaused,
  parseSelectedProfileId,
  parseStoredProfiles,
} from '#shared/utils/responseOverrides';

let selectedProfileId = '';
let captureEventQueue: CapturedRequestEvent[] = [];
let captureBatchTimer: ReturnType<typeof setTimeout> | null = null;

function publishOverrides(overrides: ResponseOverride[]) {
  const message: ResponseOverridesPageMessage = {
    type: CLOUDHOOD_RESPONSE_OVERRIDES_MESSAGE,
    overrides,
  };

  window.postMessage(message, window.location.origin);
}

async function refreshActiveOverrides() {
  const result = await browser.storage.local.get([
    BrowserStorageKey.Profiles,
    BrowserStorageKey.SelectedProfile,
    BrowserStorageKey.IsPaused,
  ]);

  selectedProfileId = parseSelectedProfileId(result[BrowserStorageKey.SelectedProfile]);

  const overrides = computeActiveResponseOverrides({
    profiles: parseStoredProfiles(result[BrowserStorageKey.Profiles]),
    selectedProfileId,
    isPaused: parseIsPaused(result[BrowserStorageKey.IsPaused]),
  });

  publishOverrides(overrides);
}

function flushCapturedRequestEvents() {
  captureBatchTimer = null;
  const events = captureEventQueue;
  captureEventQueue = [];

  if (events.length === 0) {
    return;
  }

  browser.runtime
    .sendMessage({
      type: ServiceWorkerEvent.CapturedRequestEvents,
      events,
    })
    .catch(() => undefined);
}

function enqueueCapturedRequestEvent(event: CapturedRequestEvent) {
  captureEventQueue.push(event);

  if (captureBatchTimer !== null) {
    return;
  }

  captureBatchTimer = setTimeout(flushCapturedRequestEvents, CAPTURED_REQUESTS_BRIDGE_BATCH_MS);
}

function sendSessionStart() {
  browser.runtime
    .sendMessage({
      type: ServiceWorkerEvent.CapturedRequestsSessionStarted,
    })
    .catch(() => undefined);
}

function isDocumentPrerendering(doc: Document): boolean {
  return 'prerendering' in doc && Reflect.get(doc, 'prerendering') === true;
}

function maybeSendSessionStart() {
  if (window.self !== window.top) {
    return;
  }

  if (isDocumentPrerendering(document)) {
    document.addEventListener(
      'prerenderingchange',
      () => {
        if (!isDocumentPrerendering(document)) {
          sendSessionStart();
        }
      },
      { once: true },
    );
    return;
  }

  sendSessionStart();
}

window.addEventListener('message', event => {
  if (event.source !== window) {
    return;
  }

  if (isResponseOverrideApplyErrorPageMessage(event.data)) {
    browser.runtime
      .sendMessage({
        type: ServiceWorkerEvent.ResponseOverrideApplyError,
        profileId: selectedProfileId,
        overrideId: event.data.overrideId,
        reason: event.data.reason,
      })
      .catch(() => undefined);
    return;
  }

  if (isRequestCaptureStartedPageMessage(event.data) || isRequestCaptureSettledPageMessage(event.data)) {
    enqueueCapturedRequestEvent(toCapturedRequestEventFromPageMessage(event.data));
  }
});

window.addEventListener('pageshow', event => {
  if (event.persisted) {
    maybeSendSessionStart();
  }
});

browser.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== 'local') {
    return;
  }

  const relevantKeys: string[] = [
    BrowserStorageKey.Profiles,
    BrowserStorageKey.SelectedProfile,
    BrowserStorageKey.IsPaused,
  ];

  if (relevantKeys.some(key => key in changes)) {
    refreshActiveOverrides().catch(() => undefined);
  }
});

maybeSendSessionStart();
refreshActiveOverrides().catch(() => undefined);
