import { describe, expect, it } from 'vitest';

import {
  CLOUDHOOD_REQUEST_CAPTURE_SETTLED,
  CLOUDHOOD_REQUEST_CAPTURE_STARTED,
  ServiceWorkerEvent,
} from '#shared/constants';
import {
  isCapturedRequestEventsWorkerMessage,
  isCapturedRequestsSessionStartedWorkerMessage,
  isRequestCaptureSettledPageMessage,
  isRequestCaptureStartedPageMessage,
  parseCapturedRequestEventsFromUnknown,
  RequestCaptureSettledPageMessage,
  RequestCaptureStartedPageMessage,
  toCapturedRequestEventFromPageMessage,
} from '#shared/utils/capturedRequestMessages';

describe('captured request message guards', () => {
  it('accepts well-formed started and settled page messages', () => {
    const started: RequestCaptureStartedPageMessage = {
      type: CLOUDHOOD_REQUEST_CAPTURE_STARTED,
      id: '1',
      url: 'https://example.com/api',
      method: 'GET',
      startedAt: 10,
    };
    const completed: RequestCaptureSettledPageMessage = {
      type: CLOUDHOOD_REQUEST_CAPTURE_SETTLED,
      id: '1',
      statusCode: 200,
      responseBody: '{"ok":true}',
    };
    const failed: RequestCaptureSettledPageMessage = {
      type: CLOUDHOOD_REQUEST_CAPTURE_SETTLED,
      id: '1',
      failed: true,
    };

    expect(isRequestCaptureStartedPageMessage(started)).toBe(true);
    expect(isRequestCaptureSettledPageMessage(completed)).toBe(true);
    expect(isRequestCaptureSettledPageMessage(failed)).toBe(true);
    expect(toCapturedRequestEventFromPageMessage(started)).toEqual({
      kind: 'started',
      id: '1',
      url: 'https://example.com/api',
      method: 'GET',
      startedAt: 10,
    });
    expect(toCapturedRequestEventFromPageMessage(completed)).toEqual({
      kind: 'settled',
      id: '1',
      statusCode: 200,
      responseBody: '{"ok":true}',
    });
    expect(toCapturedRequestEventFromPageMessage(failed)).toEqual({ kind: 'failed', id: '1' });
  });

  it('rejects spoofed or malformed shapes and never reads request headers or bodies', () => {
    expect(
      isRequestCaptureStartedPageMessage({
        type: CLOUDHOOD_REQUEST_CAPTURE_STARTED,
        id: '1',
        url: 'https://example.com',
        method: 'PATCH',
        startedAt: 1,
      }),
    ).toBe(false);
    expect(
      isRequestCaptureStartedPageMessage({
        type: CLOUDHOOD_REQUEST_CAPTURE_STARTED,
        id: 1,
        url: 'https://example.com',
        method: 'GET',
        startedAt: 1,
        requestHeaders: { authorization: 'secret' },
      }),
    ).toBe(false);
    expect(
      isRequestCaptureSettledPageMessage({
        type: CLOUDHOOD_REQUEST_CAPTURE_SETTLED,
        id: '1',
        statusCode: '200',
        responseBody: '{}',
      }),
    ).toBe(false);
    expect(isCapturedRequestsSessionStartedWorkerMessage({ type: ServiceWorkerEvent.Reload })).toBe(false);
    expect(isCapturedRequestsSessionStartedWorkerMessage({ type: ServiceWorkerEvent.CapturedRequestsSessionStarted })).toBe(
      true,
    );
    expect(
      isCapturedRequestEventsWorkerMessage({
        type: ServiceWorkerEvent.CapturedRequestEvents,
        events: [{ kind: 'failed', id: '1' }],
      }),
    ).toBe(true);
    expect(
      isCapturedRequestEventsWorkerMessage({
        type: ServiceWorkerEvent.CapturedRequestEvents,
        events: [{ kind: 'started', id: '1' }],
      }),
    ).toBe(false);
    expect(parseCapturedRequestEventsFromUnknown({ events: [{ kind: 'failed', id: '1' }, { kind: 'nope' }] })).toEqual([
      { kind: 'failed', id: '1' },
    ]);
  });
});
