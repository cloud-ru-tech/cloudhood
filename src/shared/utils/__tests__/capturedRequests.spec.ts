import { describe, expect, it } from 'vitest';

import { CAPTURED_REQUESTS_COPY } from '#shared/constants';
import { CapturedRequest, CapturedRequestEvent, CapturedRequestsTabRecord } from '#shared/types/capturedRequest';
import { ResponseOverrideMatchType } from '#shared/types/responseOverride';
import {
  appendCapturedRequestEvents,
  buildCapturedRequestSearchIndex,
  buildResponseOverrideFromCapturedRequest,
  capturedRequestsSessionKey,
  dropCapturedRequestBodies,
  filterCapturedRequestSearchIndex,
  formatCapturedRequestStatus,
  hasCapturedRequestSearchQuery,
  isHttpCaptureUrl,
  isJsonContentType,
  isMockableCaptureMethod,
  isRestrictedPageUrl,
  isSelectableStatusCode,
  parseCapturedRequest,
  parseCapturedRequestEvent,
  parseCapturedRequestsTabRecord,
  prettyPrintCapturedJsonBody,
  resolveCapturedRequestsViewState,
  resolveTargetTabFromCandidates,
  stripUrlFragment,
  toMockableCaptureMethod,
  trimCapturedRequestEntries,
  utf8ByteLength,
} from '#shared/utils/capturedRequests';

const createCapturedRequest = (overrides: Partial<CapturedRequest> = {}): CapturedRequest => ({
  id: 'req-1',
  url: 'https://example.com/api',
  method: 'GET',
  state: 'completed',
  statusCode: 200,
  responseBody: '{"ok":true}',
  startedAt: 1,
  ...overrides,
});

const emptyRecord = (): CapturedRequestsTabRecord => ({ entries: [] });

describe('isMockableCaptureMethod', () => {
  it('accepts the eight locked form methods, case-insensitively', () => {
    expect(isMockableCaptureMethod('GET')).toBe(true);
    expect(isMockableCaptureMethod('post')).toBe(true);
    expect(toMockableCaptureMethod('delete')).toBe('DELETE');
    expect(isMockableCaptureMethod('PROPFIND')).toBe(false);
    expect(isMockableCaptureMethod('PATCH')).toBe(false);
    expect(toMockableCaptureMethod('WEBDAV')).toBeNull();
  });
});

describe('stripUrlFragment', () => {
  it('strips the fragment and keeps the query', () => {
    expect(stripUrlFragment('https://example.com/api?q=1#section')).toBe('https://example.com/api?q=1');
  });

  it('normalizes via URL.href so mock Equals cards include a trailing slash when needed', () => {
    expect(stripUrlFragment('https://example.com')).toBe('https://example.com/');
  });
});

describe('isJsonContentType', () => {
  it('matches application/json and +json suffixes, ignoring parameters', () => {
    expect(isJsonContentType('application/json')).toBe(true);
    expect(isJsonContentType('application/json; charset=utf-8')).toBe(true);
    expect(isJsonContentType('application/ld+json')).toBe(true);
    expect(isJsonContentType('text/plain')).toBe(false);
    expect(isJsonContentType(null)).toBe(false);
  });
});

describe('isRestrictedPageUrl', () => {
  it('treats non-http(s) and store hosts as restricted', () => {
    expect(isRestrictedPageUrl('chrome://version')).toBe(true);
    expect(isRestrictedPageUrl('about:addons')).toBe(true);
    expect(isRestrictedPageUrl('https://chromewebstore.google.com/detail/x')).toBe(true);
    expect(isRestrictedPageUrl('https://chrome.google.com/webstore/detail/x')).toBe(true);
    expect(isRestrictedPageUrl('https://addons.mozilla.org/firefox')).toBe(true);
    expect(isRestrictedPageUrl('https://example.com/app')).toBe(false);
    expect(isHttpCaptureUrl('https://example.com/app')).toBe(true);
  });
});

describe('appendCapturedRequestEvents', () => {
  it('appends started events and drops stale settle/fail events', () => {
    const started: CapturedRequestEvent = {
      kind: 'started',
      id: 'a',
      url: 'https://example.com/a',
      method: 'GET',
      startedAt: 10,
    };
    const staleSettle: CapturedRequestEvent = { kind: 'settled', id: 'missing', statusCode: 200, responseBody: '{}' };
    const staleFail: CapturedRequestEvent = { kind: 'failed', id: 'also-missing' };

    const next = appendCapturedRequestEvents(emptyRecord(), [staleSettle, staleFail, started]);

    expect(next.entries).toEqual([
      {
        id: 'a',
        url: 'https://example.com/a',
        method: 'GET',
        state: 'pending',
        statusCode: null,
        responseBody: null,
        startedAt: 10,
      },
    ]);
  });

  it('updates a known id to completed or failed and ignores a duplicate start', () => {
    const started: CapturedRequestEvent = {
      kind: 'started',
      id: 'a',
      url: 'https://example.com/a',
      method: 'POST',
      startedAt: 10,
    };
    const duplicateStart: CapturedRequestEvent = { ...started, url: 'https://example.com/other' };
    const settled: CapturedRequestEvent = {
      kind: 'settled',
      id: 'a',
      statusCode: 201,
      responseBody: '{"created":true}',
    };

    const completed = appendCapturedRequestEvents(emptyRecord(), [started, duplicateStart, settled]);
    expect(completed.entries).toHaveLength(1);
    expect(completed.entries[0]).toMatchObject({
      url: 'https://example.com/a',
      state: 'completed',
      statusCode: 201,
      responseBody: '{"created":true}',
    });

    const failed = appendCapturedRequestEvents({ entries: completed.entries }, [{ kind: 'failed', id: 'a' }]);
    expect(failed.entries[0]).toMatchObject({ state: 'failed', statusCode: null, responseBody: null });
  });

  it('keeps a ring buffer of the most recent entries', () => {
    const events: CapturedRequestEvent[] = Array.from({ length: 6 }, (_, index) => ({
      kind: 'started',
      id: `req-${index}`,
      url: `https://example.com/${index}`,
      method: 'GET' as const,
      startedAt: index,
    }));

    const next = appendCapturedRequestEvents(emptyRecord(), events, {
      maxEntries: 3,
      maxBodyBytes: 1024,
      maxTotalBodyBytes: 4096,
    });

    expect(next.entries.map(entry => entry.id)).toEqual(['req-3', 'req-4', 'req-5']);
  });

  it('does not store a body over the per-response cap', () => {
    const oversized = 'x'.repeat(50);
    const next = appendCapturedRequestEvents(
      emptyRecord(),
      [
        { kind: 'started', id: 'a', url: 'https://example.com/a', method: 'GET', startedAt: 1 },
        { kind: 'settled', id: 'a', statusCode: 200, responseBody: oversized },
      ],
      { maxEntries: 10, maxBodyBytes: 16, maxTotalBodyBytes: 1024 },
    );

    expect(next.entries[0]).toMatchObject({ state: 'completed', statusCode: 200, responseBody: null });
  });

  it('evicts the oldest stored bodies first when the tab budget is exceeded', () => {
    const next = appendCapturedRequestEvents(
      emptyRecord(),
      [
        { kind: 'started', id: 'old', url: 'https://example.com/old', method: 'GET', startedAt: 1 },
        { kind: 'settled', id: 'old', statusCode: 200, responseBody: 'aaaa' },
        { kind: 'started', id: 'new', url: 'https://example.com/new', method: 'GET', startedAt: 2 },
        { kind: 'settled', id: 'new', statusCode: 200, responseBody: 'bbbb' },
      ],
      { maxEntries: 10, maxBodyBytes: 16, maxTotalBodyBytes: 6 },
    );

    expect(next.entries[0]).toMatchObject({ id: 'old', statusCode: 200, responseBody: null });
    expect(next.entries[1]).toMatchObject({ id: 'new', statusCode: 200, responseBody: 'bbbb' });
  });
});

describe('parse and quota helpers', () => {
  it('parses a valid record and drops malformed entries', () => {
    const parsed = parseCapturedRequestsTabRecord({
      entries: [createCapturedRequest(), { id: 1 }, 'nope'],
    });

    expect(parsed?.entries).toHaveLength(1);
    expect(parseCapturedRequest({ ...createCapturedRequest(), method: 'PATCH' })).toBeNull();
    expect(parseCapturedRequestEvent({ kind: 'failed', id: 'a' })).toEqual({ kind: 'failed', id: 'a' });
    expect(parseCapturedRequestEvent({ kind: 'settled', id: 'a', statusCode: null, responseBody: null, extraHeaders: {} })).toEqual({
      kind: 'settled',
      id: 'a',
      statusCode: null,
      responseBody: null,
    });
    expect(capturedRequestsSessionKey(12)).toBe('capturedRequestsV1:12');
  });

  it('drops bodies and trims oldest entries for quota fallback', () => {
    const record: CapturedRequestsTabRecord = {
      entries: [
        createCapturedRequest({ id: '1', responseBody: '{"a":1}' }),
        createCapturedRequest({ id: '2', responseBody: '{"b":2}' }),
        createCapturedRequest({ id: '3', responseBody: '{"c":3}' }),
      ],
    };

    expect(dropCapturedRequestBodies(record).entries.every(entry => entry.responseBody === null)).toBe(true);
    expect(trimCapturedRequestEntries(record, 2).entries.map(entry => entry.id)).toEqual(['2', '3']);
  });
});

describe('buildResponseOverrideFromCapturedRequest', () => {
  it('prefills Equals, absolute URL, observed method, selectable status, pretty JSON, and disabled', () => {
    const override = buildResponseOverrideFromCapturedRequest(
      createCapturedRequest({
        url: 'https://example.com/api?q=1',
        method: 'POST',
        statusCode: 201,
        responseBody: '{"ok":true}',
      }),
      [],
      99,
    );

    expect(override).toEqual({
      id: 99,
      name: 'Response №1',
      matchType: ResponseOverrideMatchType.Equals,
      url: 'https://example.com/api?q=1',
      method: 'POST',
      statusCode: 201,
      responseBody: `${JSON.stringify({ ok: true }, null, 2)}`,
      disabled: true,
    });
  });

  it('falls back to 200 OK and {} for pending, failed, opaque, non-selectable, and invalid bodies', () => {
    const cases: CapturedRequest[] = [
      createCapturedRequest({ state: 'pending', statusCode: null, responseBody: null }),
      createCapturedRequest({ state: 'failed', statusCode: null, responseBody: null }),
      createCapturedRequest({ statusCode: null, responseBody: null }),
      createCapturedRequest({ statusCode: 599, responseBody: 'not-json' }),
      createCapturedRequest({ statusCode: 204, responseBody: '' }),
    ];

    for (const captured of cases) {
      const override = buildResponseOverrideFromCapturedRequest(captured, [{ name: 'Response №3' }], 1);
      expect(override.disabled).toBe(true);
      expect(override.statusCode).toBe(captured.statusCode === 204 ? 204 : 200);
      expect(override.responseBody).toBe('{}');
      expect(override.name).toBe('Response №4');
    }
  });

  it('never enables a mock-created card even when fields are valid', () => {
    const override = buildResponseOverrideFromCapturedRequest(createCapturedRequest(), [], 1);
    expect(override.disabled).toBe(true);
    expect(isSelectableStatusCode(200)).toBe(true);
    expect(isSelectableStatusCode(599)).toBe(false);
    expect(prettyPrintCapturedJsonBody(null)).toBe('{}');
    expect(utf8ByteLength('é')).toBe(2);
    expect(formatCapturedRequestStatus(createCapturedRequest({ state: 'pending', statusCode: null }))).toBe('Pending');
    expect(formatCapturedRequestStatus(createCapturedRequest({ state: 'failed', statusCode: null }))).toBe('Failed');
    expect(formatCapturedRequestStatus(createCapturedRequest({ state: 'completed', statusCode: null }))).toBeNull();
    expect(formatCapturedRequestStatus(createCapturedRequest({ statusCode: 200 }))).toBe('200 OK');
    expect(formatCapturedRequestStatus(createCapturedRequest({ statusCode: 599 }))).toBe('599');
  });
});

describe('resolveTargetTabFromCandidates', () => {
  const extensionOrigin = 'chrome-extension://abc/';

  it('returns the active content tab in production popup mode', () => {
    const activeTab = { id: 2, url: 'https://example.com' };
    expect(
      resolveTargetTabFromCandidates({
        activeTab,
        windowTabs: [{ id: 1, url: `${extensionOrigin}popup.html` }, activeTab],
        extensionOrigin,
      }),
    ).toEqual(activeTab);
  });

  it('falls back to the single other non-extension tab when the popup is opened as a tab', () => {
    const contentTab = { id: 3, url: 'https://app.example.com/x' };
    expect(
      resolveTargetTabFromCandidates({
        activeTab: { id: 1, url: `${extensionOrigin}popup.html` },
        windowTabs: [
          { id: 1, url: `${extensionOrigin}popup.html` },
          contentTab,
        ],
        extensionOrigin,
      }),
    ).toEqual(contentTab);
  });

  it('returns no tab when the popup-as-tab fallback is ambiguous or missing', () => {
    expect(
      resolveTargetTabFromCandidates({
        activeTab: { id: 1, url: `${extensionOrigin}popup.html` },
        windowTabs: [
          { id: 1, url: `${extensionOrigin}popup.html` },
          { id: 2, url: 'https://a.example.com' },
          { id: 3, url: 'https://b.example.com' },
        ],
        extensionOrigin,
      }),
    ).toBeNull();

    expect(
      resolveTargetTabFromCandidates({
        activeTab: { id: 1, url: `${extensionOrigin}popup.html` },
        windowTabs: [{ id: 1, url: `${extensionOrigin}popup.html` }],
        extensionOrigin,
      }),
    ).toBeNull();

    expect(resolveTargetTabFromCandidates({ activeTab: null, windowTabs: [], extensionOrigin })).toBeNull();
  });
});

const readyViewInput = {
  phase: 'ready' as const,
  tab: { url: 'https://example.com' },
  record: null as CapturedRequestsTabRecord | null,
  visibleEntries: [] as CapturedRequest[],
  hasSearchQuery: false,
};

describe('buildCapturedRequestSearchIndex', () => {
  it('projects newest-first and lowercases url and body once', () => {
    const older = createCapturedRequest({
      id: 'old',
      url: 'https://Example.com/Users?Q=Alpha',
      responseBody: '{"Name":"Ada"}',
      startedAt: 1,
    });
    const newer = createCapturedRequest({
      id: 'new',
      url: 'https://example.com/pending',
      responseBody: null,
      startedAt: 2,
    });

    expect(buildCapturedRequestSearchIndex({ entries: [older, newer] })).toEqual([
      { request: newer, urlLowerCase: 'https://example.com/pending', bodyLowerCase: null },
      { request: older, urlLowerCase: 'https://example.com/users?q=alpha', bodyLowerCase: '{"name":"ada"}' },
    ]);
  });

  it('treats a missing record as an empty index and keeps evicted bodies as null', () => {
    expect(buildCapturedRequestSearchIndex(null)).toEqual([]);
    expect(buildCapturedRequestSearchIndex(emptyRecord())).toEqual([]);

    const evicted = createCapturedRequest({ id: 'evicted', responseBody: null });
    expect(buildCapturedRequestSearchIndex({ entries: [evicted] })).toEqual([
      { request: evicted, urlLowerCase: evicted.url.toLowerCase(), bodyLowerCase: null },
    ]);
  });
});

describe('filterCapturedRequestSearchIndex', () => {
  const users = createCapturedRequest({
    id: 'users',
    url: 'https://example.com/api/users?token=Secret',
    responseBody: '{"ok":true,"name":"Ada"}',
    startedAt: 1,
  });
  const orders = createCapturedRequest({
    id: 'orders',
    url: 'https://example.com/api/orders',
    responseBody: '{"total":2}',
    startedAt: 2,
  });
  const pending = createCapturedRequest({
    id: 'pending',
    url: 'https://example.com/api/pending',
    state: 'pending',
    statusCode: null,
    responseBody: null,
    startedAt: 3,
  });
  const index = buildCapturedRequestSearchIndex({ entries: [users, orders, pending] });

  it('treats empty queries as no constraint and preserves newest-first order', () => {
    expect(hasCapturedRequestSearchQuery({ urlQuery: '', bodyQuery: '' })).toBe(false);
    expect(filterCapturedRequestSearchIndex(index, { urlQuery: '', bodyQuery: '' })).toEqual([pending, orders, users]);
  });

  it('matches URL-only against the full captured URL including the query string', () => {
    expect(filterCapturedRequestSearchIndex(index, { urlQuery: 'token=secret', bodyQuery: '' }).map(entry => entry.id)).toEqual([
      'users',
    ]);
    expect(filterCapturedRequestSearchIndex(index, { urlQuery: '/API/ORDERS', bodyQuery: '' }).map(entry => entry.id)).toEqual([
      'orders',
    ]);
  });

  it('matches Body-only against stored response JSON and is case-insensitive', () => {
    expect(filterCapturedRequestSearchIndex(index, { urlQuery: '', bodyQuery: '"NAME":"ada"' }).map(entry => entry.id)).toEqual([
      'users',
    ]);
    expect(filterCapturedRequestSearchIndex(index, { urlQuery: '', bodyQuery: 'total' }).map(entry => entry.id)).toEqual(['orders']);
  });

  it('ANDs both fields and keeps a row only when both match', () => {
    expect(filterCapturedRequestSearchIndex(index, { urlQuery: '/users', bodyQuery: 'ada' }).map(entry => entry.id)).toEqual([
      'users',
    ]);
    expect(filterCapturedRequestSearchIndex(index, { urlQuery: '/users', bodyQuery: 'total' })).toEqual([]);
  });

  it('excludes null bodies only while Body is non-empty and never synthesizes {}', () => {
    expect(filterCapturedRequestSearchIndex(index, { urlQuery: '', bodyQuery: '' }).map(entry => entry.id)).toEqual([
      'pending',
      'orders',
      'users',
    ]);
    expect(filterCapturedRequestSearchIndex(index, { urlQuery: '', bodyQuery: 'pending' })).toEqual([]);
    expect(filterCapturedRequestSearchIndex(index, { urlQuery: '', bodyQuery: '{}' })).toEqual([]);
    expect(prettyPrintCapturedJsonBody(null)).toBe('{}');
  });

  it('treats a space-only query as a literal space search', () => {
    const spaced = createCapturedRequest({
      id: 'spaced',
      url: 'https://example.com/api/path with space',
      responseBody: '{ "ok": true }',
    });
    const compact = createCapturedRequest({
      id: 'compact',
      url: 'https://example.com/api/path-with-space',
      responseBody: '{"ok":true}',
    });
    const spacedIndex = buildCapturedRequestSearchIndex({ entries: [spaced, compact] });

    expect(hasCapturedRequestSearchQuery({ urlQuery: ' ', bodyQuery: '' })).toBe(true);
    expect(filterCapturedRequestSearchIndex(spacedIndex, { urlQuery: ' ', bodyQuery: '' }).map(entry => entry.id)).toEqual([
      'spaced',
    ]);
    expect(filterCapturedRequestSearchIndex(spacedIndex, { urlQuery: '', bodyQuery: ' ' }).map(entry => entry.id)).toEqual([
      'spaced',
    ]);
  });
});

describe('resolveCapturedRequestsViewState', () => {
  it('follows the locked state machine', () => {
    expect(
      resolveCapturedRequestsViewState({
        ...readyViewInput,
        phase: 'loading',
        visibleEntries: [createCapturedRequest()],
        hasSearchQuery: true,
      }),
    ).toEqual({ type: 'loading' });
    expect(
      resolveCapturedRequestsViewState({
        ...readyViewInput,
        phase: 'error',
        record: { entries: [createCapturedRequest()] },
        visibleEntries: [],
        hasSearchQuery: true,
      }),
    ).toEqual({ type: 'error' });
    expect(resolveCapturedRequestsViewState({ ...readyViewInput, tab: null, hasSearchQuery: true })).toEqual({
      type: 'no-active-page',
    });
    expect(
      resolveCapturedRequestsViewState({
        ...readyViewInput,
        tab: { url: 'chrome://version' },
        record: { entries: [createCapturedRequest()] },
        hasSearchQuery: true,
      }),
    ).toEqual({ type: 'restricted' });
    expect(resolveCapturedRequestsViewState({ ...readyViewInput, record: null })).toEqual({ type: 'empty' });
    expect(resolveCapturedRequestsViewState({ ...readyViewInput, record: emptyRecord(), hasSearchQuery: true })).toEqual({
      type: 'empty',
    });

    const older = createCapturedRequest({ id: 'old', startedAt: 1 });
    const newer = createCapturedRequest({ id: 'new', startedAt: 2 });
    const visibleEntries = filterCapturedRequestSearchIndex(buildCapturedRequestSearchIndex({ entries: [older, newer] }), {
      urlQuery: '',
      bodyQuery: '',
    });
    expect(
      resolveCapturedRequestsViewState({
        ...readyViewInput,
        record: { entries: [older, newer] },
        visibleEntries,
      }),
    ).toEqual({ type: 'list', entries: [newer, older] });
  });

  it('prefers zero captures over no-matches and maps unmatched queries to no-matches', () => {
    expect(
      resolveCapturedRequestsViewState({
        ...readyViewInput,
        record: emptyRecord(),
        visibleEntries: [],
        hasSearchQuery: true,
      }),
    ).toEqual({ type: 'empty' });

    const captured = createCapturedRequest();
    expect(
      resolveCapturedRequestsViewState({
        ...readyViewInput,
        record: { entries: [captured] },
        visibleEntries: [],
        hasSearchQuery: true,
      }),
    ).toEqual({ type: 'no-matches' });
    expect(
      resolveCapturedRequestsViewState({
        ...readyViewInput,
        record: { entries: [captured] },
        visibleEntries: [captured],
        hasSearchQuery: true,
      }),
    ).toEqual({ type: 'list', entries: [captured] });
  });

  it('keeps Sol copy available for the UI states', () => {
    expect(CAPTURED_REQUESTS_COPY.loading).toBe('Loading requests…');
    expect(CAPTURED_REQUESTS_COPY.mockCreated).toBe('Mock created. Review and enable it.');
    expect(CAPTURED_REQUESTS_COPY.searchUrlLabel).toBe('URL');
    expect(CAPTURED_REQUESTS_COPY.searchUrlPlaceholder).toBe('Search by URL');
    expect(CAPTURED_REQUESTS_COPY.searchBodyLabel).toBe('Body');
    expect(CAPTURED_REQUESTS_COPY.searchBodyPlaceholder).toBe('Search response body');
    expect(CAPTURED_REQUESTS_COPY.noMatchesTitle).toBe('No matching requests');
    expect(CAPTURED_REQUESTS_COPY.noMatchesBody).toBe('Try changing or clearing your search.');
  });
});
