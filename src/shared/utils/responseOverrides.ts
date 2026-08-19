import {
  RESPONSE_OVERRIDE_COPY,
  RESPONSE_OVERRIDE_HTTP_METHODS,
  RESPONSE_OVERRIDE_NULL_BODY_STATUSES,
  RESPONSE_OVERRIDE_STATUS_CODES,
} from '#shared/constants';
import {
  ResponseOverride,
  ResponseOverrideHttpMethod,
  ResponseOverrideMatchType,
} from '#shared/types/responseOverride';

export type ResponseOverrideMatchTarget = Pick<ResponseOverride, 'matchType' | 'url' | 'method'>;

export type ProfileResponseOverridesSnapshot = {
  id: string;
  responseOverrides: ResponseOverride[];
  responseOverridesDisabled: boolean;
};

export type ResponseOverrideApplyError = {
  profileId: string;
  overrideId: number;
  reason: string;
  timestamp: number;
};

export function isResponseOverrideHttpMethod(value: string): value is ResponseOverrideHttpMethod {
  return RESPONSE_OVERRIDE_HTTP_METHODS.some(method => method === value);
}

export function isResponseOverrideMatchType(value: string): value is ResponseOverrideMatchType {
  return (
    value === ResponseOverrideMatchType.Contains ||
    value === ResponseOverrideMatchType.Equals ||
    value === ResponseOverrideMatchType.Regex
  );
}

export function toTrimmedOverrideString(value: string | undefined | null): string {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim();
}

export function normalizeResponseOverrideFields(override: Record<string, unknown> & { id: number }): ResponseOverride {
  const { name, matchType, url, method, statusCode, responseBody, disabled } = override;
  const hasValidMatchType = typeof matchType === 'string' && isResponseOverrideMatchType(matchType);
  const hasStoredUrl = typeof url === 'string';
  const hasValidMethod = typeof method === 'string' && isResponseOverrideHttpMethod(method);
  const hasValidStatusCode = typeof statusCode === 'number' && Number.isInteger(statusCode);
  const hasStoredResponseBody = typeof responseBody === 'string';
  const hasCompleteOperationalFields =
    hasValidMatchType && hasStoredUrl && hasValidMethod && hasValidStatusCode && hasStoredResponseBody;

  return {
    id: override.id,
    name: typeof name === 'string' ? name : '',
    matchType: hasValidMatchType ? matchType : ResponseOverrideMatchType.Contains,
    url: hasStoredUrl ? url : '',
    method: hasValidMethod ? method : 'GET',
    statusCode: hasValidStatusCode ? statusCode : 200,
    responseBody: hasStoredResponseBody ? responseBody : '',
    disabled: disabled === true || !hasCompleteOperationalFields,
  };
}

export function normalizeStoredResponseOverrides(value: unknown): ResponseOverride[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap(item => {
    if (!isRecord(item) || typeof item.id !== 'number') {
      return [];
    }

    return [normalizeResponseOverrideFields({ ...item, id: item.id })];
  });
}

export function getOverrideCardViewState(override: {
  matchType?: ResponseOverrideMatchType;
  url?: string;
  responseBody?: string;
}) {
  const matchType = override.matchType ?? ResponseOverrideMatchType.Contains;
  const url = typeof override.url === 'string' ? override.url : '';
  const responseBody = typeof override.responseBody === 'string' ? override.responseBody : '';
  const isUrlValid = isValidResponseOverrideUrl(matchType, url);
  const isEmptyUrl = toTrimmedOverrideString(url) === '';

  return {
    matchType,
    url,
    responseBody,
    isUrlValid,
    isEmptyUrl,
    showUrlError: !isUrlValid && !isEmptyUrl,
    isJsonValid: isValidResponseOverrideJson(responseBody),
  };
}

export function getNextResponseOverrideName(overrides: readonly Pick<ResponseOverride, 'name'>[]): string {
  const numbers = overrides.map(override => {
    const match = typeof override.name === 'string' ? /^Response №(\d+)$/.exec(override.name) : null;
    return match ? Number(match[1]) : 0;
  });

  return `${RESPONSE_OVERRIDE_COPY.defaultNamePrefix}${Math.max(0, ...numbers) + 1}`;
}

export function createDefaultResponseOverride(id: number, name: string): ResponseOverride {
  return {
    id,
    name,
    matchType: ResponseOverrideMatchType.Contains,
    url: '',
    method: 'GET',
    statusCode: 200,
    responseBody: '{}',
    disabled: false,
  };
}

export function absolutizeRequestUrl(input: string, baseUri: string): string {
  try {
    return new URL(input, baseUri).href;
  } catch {
    return input;
  }
}

export function normalizeHttpMethod(method: string | undefined): string {
  if (!method) {
    return 'GET';
  }

  return method.toUpperCase();
}

export function doesMethodMatch(requestMethod: string, overrideMethod: ResponseOverrideHttpMethod): boolean {
  return normalizeHttpMethod(requestMethod) === overrideMethod;
}

export function tryCompileOverrideRegex(pattern: string): RegExp | null {
  try {
    return new RegExp(pattern);
  } catch {
    return null;
  }
}

function isAbsoluteHttpUrl(value: string): boolean {
  try {
    const parsedUrl = new URL(value);
    return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
  } catch {
    return false;
  }
}

export function isValidResponseOverrideUrl(matchType: ResponseOverrideMatchType, url: string | undefined): boolean {
  const trimmedUrl = toTrimmedOverrideString(url);

  if (trimmedUrl === '') {
    return false;
  }

  if (matchType === ResponseOverrideMatchType.Regex) {
    return tryCompileOverrideRegex(trimmedUrl) !== null;
  }

  if (matchType === ResponseOverrideMatchType.Equals) {
    return isAbsoluteHttpUrl(trimmedUrl);
  }

  return true;
}

export function isValidResponseOverrideJson(responseBody: string | undefined): boolean {
  if (typeof responseBody !== 'string') {
    return false;
  }

  try {
    JSON.parse(responseBody);
    return true;
  } catch {
    return false;
  }
}

export function isCompleteValidResponseOverride(override: ResponseOverride): boolean {
  return isValidResponseOverrideUrl(override.matchType, override.url) && isValidResponseOverrideJson(override.responseBody);
}

export function isApplyableResponseOverride(override: ResponseOverride): boolean {
  return !override.disabled && isCompleteValidResponseOverride(override);
}

export function doesUrlMatch(
  requestUrl: string,
  matchType: ResponseOverrideMatchType,
  pattern: string | undefined,
  compiledRegex: RegExp | null,
): boolean {
  const trimmedPattern = toTrimmedOverrideString(pattern);

  if (trimmedPattern === '') {
    return false;
  }

  if (matchType === ResponseOverrideMatchType.Contains) {
    return requestUrl.includes(trimmedPattern);
  }

  if (matchType === ResponseOverrideMatchType.Equals) {
    return requestUrl === trimmedPattern;
  }

  if (!compiledRegex) {
    return false;
  }

  return compiledRegex.test(requestUrl);
}

export function findMatchingResponseOverride<T extends ResponseOverrideMatchTarget>(
  overrides: readonly T[],
  requestUrl: string,
  requestMethod: string,
  compiledRegexByIndex: ReadonlyArray<RegExp | null>,
): T | undefined {
  const normalizedMethod = normalizeHttpMethod(requestMethod);

  return overrides.find((override, index) => {
    if (!doesMethodMatch(normalizedMethod, override.method)) {
      return false;
    }

    const compiledRegex =
      override.matchType === ResponseOverrideMatchType.Regex
        ? (compiledRegexByIndex[index] ?? tryCompileOverrideRegex(toTrimmedOverrideString(override.url)))
        : null;

    return doesUrlMatch(requestUrl, override.matchType, override.url, compiledRegex);
  });
}

export function isNullBodyStatus(statusCode: number): boolean {
  return RESPONSE_OVERRIDE_NULL_BODY_STATUSES.some(status => status === statusCode);
}

export function getStatusText(statusCode: number): string {
  const status = RESPONSE_OVERRIDE_STATUS_CODES.find(item => item.code === statusCode);
  return status?.text ?? '';
}

export function formatStatusOption(statusCode: number): string {
  const statusText = getStatusText(statusCode);
  return statusText ? `${statusCode} ${statusText}` : String(statusCode);
}

export function computeActiveResponseOverrides(input: {
  profiles: readonly ProfileResponseOverridesSnapshot[];
  selectedProfileId: string;
  isPaused: boolean;
}): ResponseOverride[] {
  if (input.isPaused || !input.selectedProfileId) {
    return [];
  }

  const selectedProfile = input.profiles.find(profile => profile.id === input.selectedProfileId);

  if (!selectedProfile || selectedProfile.responseOverridesDisabled) {
    return [];
  }

  return selectedProfile.responseOverrides.filter(isApplyableResponseOverride);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function parseResponseOverride(value: unknown): ResponseOverride | null {
  if (!isRecord(value)) {
    return null;
  }

  const { id, name, matchType, url, method, statusCode, responseBody, disabled } = value;

  if (typeof id !== 'number' || typeof name !== 'string' || typeof url !== 'string') {
    return null;
  }

  if (typeof matchType !== 'string' || !isResponseOverrideMatchType(matchType)) {
    return null;
  }

  if (typeof method !== 'string' || !isResponseOverrideHttpMethod(method)) {
    return null;
  }

  if (typeof statusCode !== 'number' || typeof responseBody !== 'string' || typeof disabled !== 'boolean') {
    return null;
  }

  return {
    id,
    name,
    matchType,
    url,
    method,
    statusCode,
    responseBody,
    disabled,
  };
}

export function parseProfileResponseOverridesSnapshot(value: unknown): ProfileResponseOverridesSnapshot | null {
  if (!isRecord(value) || typeof value.id !== 'string') {
    return null;
  }

  const rawOverrides = value.responseOverrides;

  if (rawOverrides !== undefined && !Array.isArray(rawOverrides)) {
    return null;
  }

  const responseOverrides = (rawOverrides ?? []).flatMap(item => {
    const parsed = parseResponseOverride(item);
    return parsed ? [parsed] : [];
  });

  return {
    id: value.id,
    responseOverrides,
    responseOverridesDisabled: value.responseOverridesDisabled === true,
  };
}

export function parseStoredProfiles(raw: unknown): ProfileResponseOverridesSnapshot[] {
  if (typeof raw !== 'string') {
    return [];
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }

  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed.flatMap(item => {
    const snapshot = parseProfileResponseOverridesSnapshot(item);
    return snapshot ? [snapshot] : [];
  });
}

export function parseSelectedProfileId(raw: unknown): string {
  return typeof raw === 'string' ? raw : '';
}

export function parseIsPaused(raw: unknown): boolean {
  return raw === true;
}

function safeJsonParse(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function parseResponseOverrideApplyErrors(raw: unknown): ResponseOverrideApplyError[] {
  const source = typeof raw === 'string' ? safeJsonParse(raw) : raw;

  if (!Array.isArray(source)) {
    return [];
  }

  return source.flatMap(item => {
    if (!isRecord(item)) {
      return [];
    }

    const { profileId, overrideId, reason, timestamp } = item;

    if (
      typeof profileId !== 'string' ||
      typeof overrideId !== 'number' ||
      typeof reason !== 'string' ||
      typeof timestamp !== 'number'
    ) {
      return [];
    }

    return [{ profileId, overrideId, reason, timestamp }];
  });
}

export function compileOverrideRegexes(overrides: readonly ResponseOverrideMatchTarget[]): Array<RegExp | null> {
  return overrides.map(override =>
    override.matchType === ResponseOverrideMatchType.Regex ? tryCompileOverrideRegex(toTrimmedOverrideString(override.url)) : null,
  );
}
