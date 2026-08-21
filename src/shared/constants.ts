export enum BrowserStorageKey {
  Profiles = 'requestHeaderProfilesV1',
  SelectedProfile = 'selectedHeaderProfileV1',
  IsPaused = 'isPausedV1',
  ThemeMode = 'themeMode',
  ResponseOverrideApplyErrors = 'responseOverrideApplyErrorsV1',
}

export enum ServiceWorkerEvent {
  Reload = 'reload',
  ResponseOverrideApplyError = 'responseOverrideApplyError',
  CapturedRequestEvents = 'capturedRequestEvents',
  CapturedRequestsSessionStarted = 'capturedRequestsSessionStarted',
}

export const CLOUDHOOD_RESPONSE_OVERRIDES_MESSAGE = 'CLOUDHOOD_RESPONSE_OVERRIDES';
export const CLOUDHOOD_RESPONSE_OVERRIDE_APPLY_ERROR_MESSAGE = 'CLOUDHOOD_RESPONSE_OVERRIDE_APPLY_ERROR';
export const CLOUDHOOD_REQUEST_CAPTURE_STARTED = 'CLOUDHOOD_REQUEST_CAPTURE_STARTED';
export const CLOUDHOOD_REQUEST_CAPTURE_SETTLED = 'CLOUDHOOD_REQUEST_CAPTURE_SETTLED';

export const CAPTURED_REQUESTS_SESSION_KEY_PREFIX = 'capturedRequestsV1:';
export const CAPTURED_REQUESTS_MAX_ENTRIES = 500;
export const CAPTURED_REQUESTS_MAX_BODY_BYTES = 256 * 1024;
export const CAPTURED_REQUESTS_MAX_TOTAL_BODY_BYTES = 2 * 1024 * 1024;
export const CAPTURED_REQUESTS_BRIDGE_BATCH_MS = 100;
export const CAPTURED_REQUESTS_SESSION_WRITE_DEBOUNCE_MS = 150;

export const RESPONSE_OVERRIDE_APPLY_ERRORS_LIMIT = 20;

export const RESPONSE_OVERRIDE_HTTP_METHODS = [
  'GET',
  'HEAD',
  'POST',
  'PUT',
  'DELETE',
  'CONNECT',
  'OPTIONS',
  'TRACE',
] as const;

export const RESPONSE_OVERRIDE_NULL_BODY_STATUSES = [204, 205, 304] as const;

export const RESPONSE_OVERRIDE_STATUS_CODES = [
  { code: 200, text: 'OK' },
  { code: 201, text: 'Created' },
  { code: 202, text: 'Accepted' },
  { code: 203, text: 'Non-Authoritative Information' },
  { code: 204, text: 'No Content' },
  { code: 205, text: 'Reset Content' },
  { code: 206, text: 'Partial Content' },
  { code: 207, text: 'Multi-Status' },
  { code: 208, text: 'Already Reported' },
  { code: 226, text: 'IM Used' },
  { code: 300, text: 'Multiple Choices' },
  { code: 301, text: 'Moved Permanently' },
  { code: 302, text: 'Found' },
  { code: 303, text: 'See Other' },
  { code: 304, text: 'Not Modified' },
  { code: 307, text: 'Temporary Redirect' },
  { code: 308, text: 'Permanent Redirect' },
  { code: 400, text: 'Bad Request' },
  { code: 401, text: 'Unauthorized' },
  { code: 402, text: 'Payment Required' },
  { code: 403, text: 'Forbidden' },
  { code: 404, text: 'Not Found' },
  { code: 405, text: 'Method Not Allowed' },
  { code: 406, text: 'Not Acceptable' },
  { code: 407, text: 'Proxy Authentication Required' },
  { code: 408, text: 'Request Timeout' },
  { code: 409, text: 'Conflict' },
  { code: 410, text: 'Gone' },
  { code: 411, text: 'Length Required' },
  { code: 412, text: 'Precondition Failed' },
  { code: 413, text: 'Payload Too Large' },
  { code: 414, text: 'URI Too Long' },
  { code: 415, text: 'Unsupported Media Type' },
  { code: 416, text: 'Range Not Satisfiable' },
  { code: 417, text: 'Expectation Failed' },
  { code: 418, text: "I'm a teapot" },
  { code: 421, text: 'Misdirected Request' },
  { code: 422, text: 'Unprocessable Entity' },
  { code: 423, text: 'Locked' },
  { code: 424, text: 'Failed Dependency' },
  { code: 425, text: 'Too Early' },
  { code: 426, text: 'Upgrade Required' },
  { code: 428, text: 'Precondition Required' },
  { code: 429, text: 'Too Many Requests' },
  { code: 431, text: 'Request Header Fields Too Large' },
  { code: 451, text: 'Unavailable For Legal Reasons' },
  { code: 500, text: 'Internal Server Error' },
  { code: 501, text: 'Not Implemented' },
  { code: 502, text: 'Bad Gateway' },
  { code: 503, text: 'Service Unavailable' },
  { code: 504, text: 'Gateway Timeout' },
  { code: 505, text: 'HTTP Version Not Supported' },
  { code: 506, text: 'Variant Also Negotiates' },
  { code: 507, text: 'Insufficient Storage' },
  { code: 508, text: 'Loop Detected' },
  { code: 510, text: 'Not Extended' },
  { code: 511, text: 'Network Authentication Required' },
] as const;

export const RESPONSE_OVERRIDE_COPY = {
  tab: 'Modify responses',
  section: 'Responses',
  defaultNamePrefix: 'Response №',
  ifRequest: 'If request',
  url: 'URL',
  httpMethod: 'HTTP Method',
  statusCode: 'Status code',
  json: 'JSON',
  urlPlaceholder: 'https://example.com',
  incorrectFormat: 'Incorrect format',
  deleteAllTitle: 'Remove all response overrides',
  deleteAllBody: 'All response overrides will be removed from this profile. This action cannot be undone.',
  cancel: 'Cancel',
  delete: 'Delete',
  matchTooltip: 'Match the full request URL using Contains, Equals, or RegEx. Request bodies are not matched.',
  applyError: 'Couldn’t apply a response override. The request was sent normally.',
} as const;

export const CAPTURED_REQUESTS_COPY = {
  tab: 'Requests',
  loading: 'Loading requests…',
  noActivePage: 'Open a web page to view requests.',
  emptyTitle: 'No requests yet',
  emptyBody: 'Reload the page or use it to capture Fetch and XHR requests.',
  restrictedTitle: 'Requests aren’t available on this page',
  restrictedBody: 'Open a regular website tab and try again.',
  errorTitle: 'Couldn’t load requests',
  errorBody: 'Try again. If the problem continues, reload the page.',
  retry: 'Try again',
  pending: 'Pending',
  failed: 'Failed',
  mock: 'Mock',
  mockCreated: 'Mock created. Review and enable it.',
  searchUrlLabel: 'URL',
  searchUrlPlaceholder: 'Search by URL',
  searchBodyLabel: 'Body',
  searchBodyPlaceholder: 'Search response body',
  noMatchesTitle: 'No matching requests',
  noMatchesBody: 'Try changing or clearing your search.',
} as const;

export enum Extensions {
  ModHeader = 'modheader',
  Requestly = 'requestly',
}

export enum ThemeMode {
  Light = 'light',
  Dark = 'dark',
  System = 'system',
}
