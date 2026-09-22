import type { Profile, RequestHeader } from '#entities/request-profile/types';
import { generateIdWithExcludeList } from '#shared/utils/generateId';
import { validateHeader } from '#shared/utils/headers';

export const SHARE_HEADERS_FRAGMENT_KEY = '__cloudhood';

export type ShareHeadersPayloadV1 = {
  version: 1;
  headers: Array<Pick<RequestHeader, 'name' | 'value'>>;
};

export type ParsedSharedHeadersUrl = {
  headers: ShareHeadersPayloadV1['headers'];
  hostname: string;
  origin: string;
  sanitizedUrl: string;
};

function encodeBase64Url(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = '';

  bytes.forEach(byte => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/u, '');
}

function decodeBase64Url(value: string) {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));

  return new TextDecoder().decode(bytes);
}

export function normalizeSharedHeadersOrigin(input: string) {
  const trimmedInput = input.trim();
  if (!trimmedInput) {
    throw new Error('Enter a domain');
  }

  const normalizedInput = /^https?:\/\//iu.test(trimmedInput) ? trimmedInput : `https://${trimmedInput}`;
  let url: URL;

  try {
    url = new URL(normalizedInput);
  } catch {
    throw new Error('Enter a valid domain or HTTP(S) origin');
  }

  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('Only HTTP and HTTPS domains are supported');
  }

  if (url.username || url.password) {
    throw new Error('Domain must not contain credentials');
  }

  if (url.pathname !== '/' || url.search || url.hash) {
    throw new Error('Enter a domain without a path, query, or fragment');
  }

  return url.origin;
}

export function createSharedHeadersUrl(domain: string, requestHeaders: RequestHeader[]) {
  const origin = normalizeSharedHeadersOrigin(domain);
  const headers = requestHeaders
    .filter(({ disabled, name, value }) => !disabled && validateHeader(name, value))
    .map(({ name, value }) => ({ name, value }));

  if (headers.length === 0) {
    throw new Error('The selected profile has no active valid headers');
  }

  const payload: ShareHeadersPayloadV1 = { version: 1, headers };
  const url = new URL(origin);
  url.hash = `${SHARE_HEADERS_FRAGMENT_KEY}=${encodeBase64Url(JSON.stringify(payload))}`;

  return url.toString();
}

export function parseSharedHeadersUrl(value: string): ParsedSharedHeadersUrl | null {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    return null;
  }

  const fragment = new URLSearchParams(url.hash.slice(1));
  const encodedPayload = fragment.get(SHARE_HEADERS_FRAGMENT_KEY);
  if (!encodedPayload) {
    return null;
  }

  try {
    const payload = JSON.parse(decodeBase64Url(encodedPayload)) as Partial<ShareHeadersPayloadV1>;
    if (
      payload.version !== 1 ||
      !Array.isArray(payload.headers) ||
      payload.headers.length === 0 ||
      !payload.headers.every(
        header =>
          typeof header === 'object' &&
          header !== null &&
          typeof header.name === 'string' &&
          typeof header.value === 'string' &&
          validateHeader(header.name, header.value),
      )
    ) {
      return null;
    }

    fragment.delete(SHARE_HEADERS_FRAGMENT_KEY);
    const remainingFragment = fragment.toString();
    url.hash = remainingFragment ? remainingFragment : '';

    return {
      headers: payload.headers,
      hostname: url.hostname,
      origin: url.origin,
      sanitizedUrl: url.toString(),
    };
  } catch {
    return null;
  }
}

export function createProfileFromSharedHeaders(
  parsedUrl: ParsedSharedHeadersUrl,
  existingProfiles: Profile[],
): Profile {
  const profileIds = existingProfiles.map(profile => Number(profile.id)).filter(Number.isFinite);
  const headerIds = existingProfiles.flatMap(profile => profile.requestHeaders.map(header => header.id));
  const allocatedHeaderIds = [...headerIds];

  const requestHeaders = parsedUrl.headers.map(header => {
    const id = generateIdWithExcludeList(allocatedHeaderIds);
    allocatedHeaderIds.push(id);

    return { ...header, id, disabled: false };
  });

  return {
    id: generateIdWithExcludeList(profileIds).toString(),
    name: `Shared: ${parsedUrl.hostname}`,
    requestHeaders,
    requestCookies: [],
    urlFilters: [{ id: generateIdWithExcludeList(), value: parsedUrl.origin, disabled: false }],
  };
}
