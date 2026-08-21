import {
  CAPTURED_REQUESTS_COPY,
  CAPTURED_REQUESTS_MAX_BODY_BYTES,
  CAPTURED_REQUESTS_MAX_ENTRIES,
  CAPTURED_REQUESTS_MAX_TOTAL_BODY_BYTES,
  CAPTURED_REQUESTS_SESSION_KEY_PREFIX,
  RESPONSE_OVERRIDE_STATUS_CODES,
} from '#shared/constants';
import {
  CapturedRequest,
  CapturedRequestEvent,
  CapturedRequestSearchIndexEntry,
  CapturedRequestSearchQuery,
  CapturedRequestsTabRecord,
  CapturedRequestsViewState,
  TargetTabCandidate,
} from '#shared/types/capturedRequest';
import { ResponseOverride, ResponseOverrideHttpMethod, ResponseOverrideMatchType } from '#shared/types/responseOverride';
import {
  formatStatusOption,
  getNextResponseOverrideName,
  isResponseOverrideHttpMethod,
  normalizeHttpMethod,
} from '#shared/utils/responseOverrides';

export type CapturedRequestsCaps = {
  maxEntries: number;
  maxBodyBytes: number;
  maxTotalBodyBytes: number;
};

export const DEFAULT_CAPTURED_REQUESTS_CAPS: CapturedRequestsCaps = {
  maxEntries: CAPTURED_REQUESTS_MAX_ENTRIES,
  maxBodyBytes: CAPTURED_REQUESTS_MAX_BODY_BYTES,
  maxTotalBodyBytes: CAPTURED_REQUESTS_MAX_TOTAL_BODY_BYTES,
};

const RESTRICTED_HOSTS = new Set(['chromewebstore.google.com', 'addons.mozilla.org']);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function capturedRequestsSessionKey(tabId: number): string {
  return `${CAPTURED_REQUESTS_SESSION_KEY_PREFIX}${tabId}`;
}

export function isCapturedRequestsSessionKey(key: string): boolean {
  return key.startsWith(CAPTURED_REQUESTS_SESSION_KEY_PREFIX);
}

export function utf8ByteLength(value: string): number {
  return new TextEncoder().encode(value).length;
}

export function toMockableCaptureMethod(value: string): ResponseOverrideHttpMethod | null {
  const normalizedMethod = normalizeHttpMethod(value);
  return isResponseOverrideHttpMethod(normalizedMethod) ? normalizedMethod : null;
}

export function isMockableCaptureMethod(value: string): boolean {
  return toMockableCaptureMethod(value) !== null;
}

export function isHttpCaptureUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
  } catch {
    return false;
  }
}

export function stripUrlFragment(url: string): string {
  try {
    const parsedUrl = new URL(url);
    parsedUrl.hash = '';
    return parsedUrl.href;
  } catch {
    return url;
  }
}

export function isJsonContentType(contentType: string | null | undefined): boolean {
  if (typeof contentType !== 'string') {
    return false;
  }

  const mediaType = contentType.split(';')[0]?.trim().toLowerCase();

  if (!mediaType) {
    return false;
  }

  return mediaType === 'application/json' || mediaType.endsWith('+json');
}

export function isSelectableStatusCode(statusCode: number): boolean {
  return RESPONSE_OVERRIDE_STATUS_CODES.some(status => status.code === statusCode);
}

export function formatCapturedRequestStatus(request: CapturedRequest): string | null {
  if (request.state === 'pending') {
    return CAPTURED_REQUESTS_COPY.pending;
  }

  if (request.state === 'failed') {
    return CAPTURED_REQUESTS_COPY.failed;
  }

  if (request.statusCode === null) {
    return null;
  }

  return formatStatusOption(request.statusCode);
}

export function prettyPrintCapturedJsonBody(responseBody: string | null): string {
  if (responseBody === null || responseBody === '') {
    return '{}';
  }

  try {
    return JSON.stringify(JSON.parse(responseBody), null, 2);
  } catch {
    return '{}';
  }
}

export function isRestrictedPageUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);

    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      return true;
    }

    if (parsedUrl.hostname === 'chrome.google.com' && parsedUrl.pathname.startsWith('/webstore')) {
      return true;
    }

    return RESTRICTED_HOSTS.has(parsedUrl.hostname);
  } catch {
    return true;
  }
}

export function parseCapturedRequest(value: unknown): CapturedRequest | null {
  if (!isRecord(value) || typeof value.id !== 'string' || typeof value.url !== 'string') {
    return null;
  }

  if (typeof value.method !== 'string' || !isResponseOverrideHttpMethod(value.method)) {
    return null;
  }

  if (value.state !== 'pending' && value.state !== 'completed' && value.state !== 'failed') {
    return null;
  }

  if (value.statusCode !== null && (typeof value.statusCode !== 'number' || !Number.isInteger(value.statusCode))) {
    return null;
  }

  if (value.responseBody !== null && typeof value.responseBody !== 'string') {
    return null;
  }

  if (typeof value.startedAt !== 'number' || !Number.isFinite(value.startedAt)) {
    return null;
  }

  return {
    id: value.id,
    url: value.url,
    method: value.method,
    state: value.state,
    statusCode: value.statusCode,
    responseBody: value.responseBody,
    startedAt: value.startedAt,
  };
}

export function parseCapturedRequestsTabRecord(value: unknown): CapturedRequestsTabRecord | null {
  if (!isRecord(value) || !Array.isArray(value.entries)) {
    return null;
  }

  const entries = value.entries.flatMap(item => {
    const parsed = parseCapturedRequest(item);
    return parsed ? [parsed] : [];
  });

  return { entries };
}

export function parseCapturedRequestEvent(value: unknown): CapturedRequestEvent | null {
  if (!isRecord(value) || typeof value.id !== 'string') {
    return null;
  }

  if (value.kind === 'started') {
    if (typeof value.url !== 'string' || typeof value.method !== 'string' || !isResponseOverrideHttpMethod(value.method)) {
      return null;
    }

    if (typeof value.startedAt !== 'number' || !Number.isFinite(value.startedAt)) {
      return null;
    }

    return {
      kind: 'started',
      id: value.id,
      url: value.url,
      method: value.method,
      startedAt: value.startedAt,
    };
  }

  if (value.kind === 'settled') {
    if (value.statusCode !== null && (typeof value.statusCode !== 'number' || !Number.isInteger(value.statusCode))) {
      return null;
    }

    if (value.responseBody !== null && typeof value.responseBody !== 'string') {
      return null;
    }

    return {
      kind: 'settled',
      id: value.id,
      statusCode: value.statusCode ?? null,
      responseBody: value.responseBody ?? null,
    };
  }

  if (value.kind === 'failed') {
    return { kind: 'failed', id: value.id };
  }

  return null;
}

function dropOldestEntries(entries: CapturedRequest[], maxEntries: number): CapturedRequest[] {
  if (entries.length <= maxEntries) {
    return entries;
  }

  return entries.slice(entries.length - maxEntries);
}

function evictOldestBodies(entries: CapturedRequest[], maxTotalBodyBytes: number): CapturedRequest[] {
  let totalBodyBytes = 0;

  for (const entry of entries) {
    if (entry.responseBody !== null) {
      totalBodyBytes += utf8ByteLength(entry.responseBody);
    }
  }

  if (totalBodyBytes <= maxTotalBodyBytes) {
    return entries;
  }

  return entries.map(entry => {
    if (totalBodyBytes <= maxTotalBodyBytes || entry.responseBody === null) {
      return entry;
    }

    totalBodyBytes -= utf8ByteLength(entry.responseBody);
    return { ...entry, responseBody: null };
  });
}

function applyStartedEvent(
  entries: CapturedRequest[],
  event: Extract<CapturedRequestEvent, { kind: 'started' }>,
  maxEntries: number,
): CapturedRequest[] {
  if (entries.some(entry => entry.id === event.id)) {
    return entries;
  }

  return dropOldestEntries(
    [
      ...entries,
      {
        id: event.id,
        url: event.url,
        method: event.method,
        state: 'pending',
        statusCode: null,
        responseBody: null,
        startedAt: event.startedAt,
      },
    ],
    maxEntries,
  );
}

function applySettledEvent(
  entries: CapturedRequest[],
  event: Extract<CapturedRequestEvent, { kind: 'settled' }>,
  maxBodyBytes: number,
): CapturedRequest[] {
  return entries.map(entry => {
    if (entry.id !== event.id) {
      return entry;
    }

    const storedBody =
      event.responseBody !== null && utf8ByteLength(event.responseBody) <= maxBodyBytes ? event.responseBody : null;

    return {
      ...entry,
      state: 'completed',
      statusCode: event.statusCode,
      responseBody: storedBody,
    };
  });
}

function applyFailedEvent(entries: CapturedRequest[], event: Extract<CapturedRequestEvent, { kind: 'failed' }>): CapturedRequest[] {
  return entries.map(entry => {
    if (entry.id !== event.id) {
      return entry;
    }

    return {
      ...entry,
      state: 'failed',
      statusCode: null,
      responseBody: null,
    };
  });
}

export function appendCapturedRequestEvents(
  record: CapturedRequestsTabRecord,
  events: readonly CapturedRequestEvent[],
  caps: CapturedRequestsCaps = DEFAULT_CAPTURED_REQUESTS_CAPS,
): CapturedRequestsTabRecord {
  const knownIds = new Set(record.entries.map(entry => entry.id));
  let entries = record.entries;

  for (const event of events) {
    if (event.kind === 'started') {
      entries = applyStartedEvent(entries, event, caps.maxEntries);
      knownIds.add(event.id);
      continue;
    }

    if (!knownIds.has(event.id)) {
      continue;
    }

    if (event.kind === 'settled') {
      entries = applySettledEvent(entries, event, caps.maxBodyBytes);
      continue;
    }

    entries = applyFailedEvent(entries, event);
  }

  return { entries: evictOldestBodies(entries, caps.maxTotalBodyBytes) };
}

export function dropCapturedRequestBodies(record: CapturedRequestsTabRecord): CapturedRequestsTabRecord {
  return {
    entries: record.entries.map(entry => ({ ...entry, responseBody: null })),
  };
}

export function trimCapturedRequestEntries(record: CapturedRequestsTabRecord, keepCount: number): CapturedRequestsTabRecord {
  const safeKeepCount = Math.max(0, keepCount);
  return { entries: record.entries.slice(Math.max(0, record.entries.length - safeKeepCount)) };
}

export function buildResponseOverrideFromCapturedRequest(
  captured: CapturedRequest,
  existingOverrides: readonly Pick<ResponseOverride, 'name'>[],
  id: number,
): ResponseOverride {
  const statusCode =
    captured.statusCode !== null && isSelectableStatusCode(captured.statusCode) ? captured.statusCode : 200;

  return {
    id,
    name: getNextResponseOverrideName(existingOverrides),
    matchType: ResponseOverrideMatchType.Equals,
    url: captured.url,
    method: captured.method,
    statusCode,
    responseBody: prettyPrintCapturedJsonBody(captured.responseBody),
    disabled: true,
  };
}

export function resolveTargetTabFromCandidates(input: {
  activeTab: TargetTabCandidate | null;
  windowTabs: readonly TargetTabCandidate[];
  extensionOrigin: string;
}): TargetTabCandidate | null {
  const { activeTab, windowTabs, extensionOrigin } = input;

  if (!activeTab) {
    return null;
  }

  const isExtensionTab = typeof activeTab.url === 'string' && activeTab.url.startsWith(extensionOrigin);

  if (!isExtensionTab) {
    return activeTab;
  }

  const contentTabs = windowTabs.filter(tab => {
    if (tab.id === activeTab.id) {
      return false;
    }

    return typeof tab.url === 'string' && !tab.url.startsWith(extensionOrigin);
  });

  if (contentTabs.length === 1) {
    return contentTabs[0];
  }

  return null;
}

export function buildCapturedRequestSearchIndex(
  record: CapturedRequestsTabRecord | null,
): CapturedRequestSearchIndexEntry[] {
  const entries = record?.entries ?? [];

  return [...entries].reverse().map(request => ({
    request,
    urlLowerCase: request.url.toLowerCase(),
    bodyLowerCase: request.responseBody === null ? null : request.responseBody.toLowerCase(),
  }));
}

export function hasCapturedRequestSearchQuery(query: CapturedRequestSearchQuery): boolean {
  return query.urlQuery.length > 0 || query.bodyQuery.length > 0;
}

export function filterCapturedRequestSearchIndex(
  index: readonly CapturedRequestSearchIndexEntry[],
  query: CapturedRequestSearchQuery,
): CapturedRequest[] {
  const urlNeedle = query.urlQuery.toLowerCase();
  const bodyNeedle = query.bodyQuery.toLowerCase();
  const hasUrlQuery = query.urlQuery.length > 0;
  const hasBodyQuery = query.bodyQuery.length > 0;

  return index.flatMap(entry => {
    if (hasUrlQuery && !entry.urlLowerCase.includes(urlNeedle)) {
      return [];
    }

    if (hasBodyQuery && (entry.bodyLowerCase === null || !entry.bodyLowerCase.includes(bodyNeedle))) {
      return [];
    }

    return [entry.request];
  });
}

export function resolveCapturedRequestsViewState(input: {
  phase: 'loading' | 'ready' | 'error';
  tab: { url: string } | null;
  record: CapturedRequestsTabRecord | null;
  visibleEntries: CapturedRequest[];
  hasSearchQuery: boolean;
}): CapturedRequestsViewState {
  if (input.phase === 'loading') {
    return { type: 'loading' };
  }

  if (input.phase === 'error') {
    return { type: 'error' };
  }

  if (!input.tab || input.tab.url === '') {
    return { type: 'no-active-page' };
  }

  if (isRestrictedPageUrl(input.tab.url)) {
    return { type: 'restricted' };
  }

  if (!isHttpCaptureUrl(input.tab.url)) {
    return { type: 'restricted' };
  }

  const entries = input.record?.entries ?? [];

  if (entries.length === 0) {
    return { type: 'empty' };
  }

  if (input.visibleEntries.length === 0 && input.hasSearchQuery) {
    return { type: 'no-matches' };
  }

  return { type: 'list', entries: input.visibleEntries };
}
