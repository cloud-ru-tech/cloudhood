import {
  CAPTURED_REQUESTS_MAX_BODY_BYTES,
  CLOUDHOOD_REQUEST_CAPTURE_SETTLED,
  CLOUDHOOD_REQUEST_CAPTURE_STARTED,
  CLOUDHOOD_RESPONSE_OVERRIDE_APPLY_ERROR_MESSAGE,
} from '#shared/constants';
import { ResponseOverride } from '#shared/types/responseOverride';
import {
  RequestCaptureSettledPageMessage,
  RequestCaptureStartedPageMessage,
} from '#shared/utils/capturedRequestMessages';
import {
  isHttpCaptureUrl,
  isJsonContentType,
  stripUrlFragment,
  toMockableCaptureMethod,
  utf8ByteLength,
} from '#shared/utils/capturedRequests';
import {
  isResponseOverridesPageMessage,
  ResponseOverrideApplyErrorPageMessage,
} from '#shared/utils/responseOverrideMessages';
import {
  absolutizeRequestUrl,
  compileOverrideRegexes,
  findMatchingResponseOverride,
  getStatusText,
  isNullBodyStatus,
  normalizeHttpMethod,
} from '#shared/utils/responseOverrides';

const XHR_OPEN_FALLBACK_METHOD = 'GET';

function doesXhrOpenRejectMethod(method: string): boolean {
  const normalizedMethod = normalizeHttpMethod(method);
  return normalizedMethod === 'CONNECT' || normalizedMethod === 'TRACE' || normalizedMethod === 'TRACK';
}

function createUnsupportedXhrMethodError(method: string): DOMException {
  return new DOMException(
    `Failed to execute 'open' on 'XMLHttpRequest': '${normalizeHttpMethod(method)}' HTTP method is unsupported.`,
    'SecurityError',
  );
}

const originalFetch = window.fetch.bind(window);
const OriginalXMLHttpRequest = window.XMLHttpRequest;

let activeOverrides: ResponseOverride[] = [];
let compiledRegexByIndex: Array<RegExp | null> = [];
let captureSequence = 0;

function postApplyError(overrideId: number, reason: string) {
  const message: ResponseOverrideApplyErrorPageMessage = {
    type: CLOUDHOOD_RESPONSE_OVERRIDE_APPLY_ERROR_MESSAGE,
    overrideId,
    reason,
  };

  window.postMessage(message, window.location.origin);
}

function postCaptureStarted(message: RequestCaptureStartedPageMessage) {
  try {
    window.postMessage(message, window.location.origin);
  } catch {
    return;
  }
}

function postCaptureSettled(message: RequestCaptureSettledPageMessage) {
  try {
    window.postMessage(message, window.location.origin);
  } catch {
    return;
  }
}

function createCaptureId(): string {
  captureSequence += 1;
  return `${captureSequence}-${Math.random().toString(36).slice(2, 11)}`;
}

function tryStartCapture(requestUrl: string, requestMethod: string): string | null {
  try {
    const mockableMethod = toMockableCaptureMethod(requestMethod);
    const capturedUrl = stripUrlFragment(requestUrl);

    if (!mockableMethod || !isHttpCaptureUrl(capturedUrl)) {
      return null;
    }

    const id = createCaptureId();
    postCaptureStarted({
      type: CLOUDHOOD_REQUEST_CAPTURE_STARTED,
      id,
      url: capturedUrl,
      method: mockableMethod,
      startedAt: Date.now(),
    });
    return id;
  } catch {
    return null;
  }
}

function postCaptureFailed(captureId: string | null) {
  if (!captureId) {
    return;
  }

  postCaptureSettled({
    type: CLOUDHOOD_REQUEST_CAPTURE_SETTLED,
    id: captureId,
    failed: true,
  });
}

function postCaptureCompleted(captureId: string | null, statusCode: number | null, responseBody: string | null) {
  if (!captureId) {
    return;
  }

  postCaptureSettled({
    type: CLOUDHOOD_REQUEST_CAPTURE_SETTLED,
    id: captureId,
    statusCode,
    responseBody,
  });
}

function captureFetchResponse(captureId: string, response: Response) {
  const statusCode = response.status === 0 ? null : response.status;
  const contentType = response.headers.get('content-type');
  const contentLengthHeader = response.headers.get('content-length');

  if (!isJsonContentType(contentType)) {
    postCaptureCompleted(captureId, statusCode, null);
    return;
  }

  if (contentLengthHeader !== null) {
    const contentLength = Number(contentLengthHeader);
    if (Number.isFinite(contentLength) && contentLength > CAPTURED_REQUESTS_MAX_BODY_BYTES) {
      postCaptureCompleted(captureId, statusCode, null);
      return;
    }
  }

  response
    .clone()
    .text()
    .then(text => {
      const responseBody = utf8ByteLength(text) > CAPTURED_REQUESTS_MAX_BODY_BYTES ? null : text;
      postCaptureCompleted(captureId, statusCode, responseBody);
    })
    .catch(() => {
      postCaptureCompleted(captureId, statusCode, null);
    });
}

function attachFetchCapture(promise: Promise<Response>, captureId: string | null): Promise<Response> {
  if (!captureId) {
    return promise;
  }

  return promise.then(
    response => {
      try {
        captureFetchResponse(captureId, response);
      } catch {
        postCaptureCompleted(captureId, response.status === 0 ? null : response.status, null);
      }
      return response;
    },
    (error: unknown) => {
      postCaptureFailed(captureId);
      throw error;
    },
  );
}

function readXhrCaptureBody(xhr: XMLHttpRequest): string | null {
  try {
    if (!isJsonContentType(xhr.getResponseHeader('content-type'))) {
      return null;
    }

    if (xhr.responseType === '' || xhr.responseType === 'text') {
      const responseText = xhr.responseText;
      return utf8ByteLength(responseText) > CAPTURED_REQUESTS_MAX_BODY_BYTES ? null : responseText;
    }

    if (xhr.responseType === 'json') {
      if (xhr.response === null || xhr.response === undefined) {
        return null;
      }

      const serialized = JSON.stringify(xhr.response);
      return utf8ByteLength(serialized) > CAPTURED_REQUESTS_MAX_BODY_BYTES ? null : serialized;
    }

    return null;
  } catch {
    return null;
  }
}

function attachXhrCaptureListeners(xhr: XMLHttpRequest, captureId: string | null) {
  if (!captureId) {
    return;
  }

  let settled = false;

  const settleOnce = (handler: () => void) => {
    if (settled) {
      return;
    }

    settled = true;

    try {
      handler();
    } catch {
      postCaptureFailed(captureId);
    }
  };

  xhr.addEventListener('load', () => {
    settleOnce(() => {
      const statusCode = xhr.status === 0 ? null : xhr.status;
      postCaptureCompleted(captureId, statusCode, readXhrCaptureBody(xhr));
    });
  });
  xhr.addEventListener('error', () => {
    settleOnce(() => postCaptureFailed(captureId));
  });
  xhr.addEventListener('timeout', () => {
    settleOnce(() => postCaptureFailed(captureId));
  });
  xhr.addEventListener('abort', () => {
    settleOnce(() => postCaptureFailed(captureId));
  });
}

function isRequest(value: RequestInfo | URL): value is Request {
  return typeof Request !== 'undefined' && value instanceof Request;
}

function isUrlObject(value: RequestInfo | URL): value is URL {
  return value instanceof URL;
}

function resolveFetchUrl(input: RequestInfo | URL): string {
  if (isRequest(input)) {
    return input.url;
  }

  if (isUrlObject(input)) {
    return input.href;
  }

  return absolutizeRequestUrl(input, document.baseURI);
}

function resolveFetchMethod(input: RequestInfo | URL, init?: RequestInit): string {
  if (init?.method) {
    return init.method;
  }

  if (isRequest(input)) {
    return input.method;
  }

  return 'GET';
}

function createSyntheticResponse(override: ResponseOverride): Response {
  const statusText = getStatusText(override.statusCode);
  const body = isNullBodyStatus(override.statusCode) ? null : override.responseBody;

  return new Response(body, {
    status: override.statusCode,
    statusText,
    headers: { 'content-type': 'application/json' },
  });
}

window.fetch = function cloudhoodFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  let captureId: string | null = null;

  try {
    const requestUrl = resolveFetchUrl(input);
    const requestMethod = resolveFetchMethod(input, init);
    captureId = tryStartCapture(requestUrl, requestMethod);
    const matchingOverride = findMatchingResponseOverride(
      activeOverrides,
      requestUrl,
      requestMethod,
      compiledRegexByIndex,
    );

    if (!matchingOverride) {
      return attachFetchCapture(originalFetch(input, init), captureId);
    }

    try {
      const syntheticResponse = createSyntheticResponse(matchingOverride);
      postCaptureCompleted(captureId, matchingOverride.statusCode, matchingOverride.responseBody);
      return Promise.resolve(syntheticResponse);
    } catch (error) {
      postApplyError(matchingOverride.id, error instanceof Error ? error.message : 'Failed to synthesize fetch response');
      return attachFetchCapture(originalFetch(input, init), captureId);
    }
  } catch {
    return attachFetchCapture(originalFetch(input, init), captureId);
  }
};

function createSyntheticXhrBody(override: ResponseOverride, responseType: XMLHttpRequestResponseType): unknown {
  const bodyText = isNullBodyStatus(override.statusCode) ? '' : override.responseBody;

  if (responseType === 'json') {
    return bodyText === '' ? null : JSON.parse(bodyText);
  }

  if (responseType === 'blob') {
    return new Blob([bodyText], { type: 'application/json' });
  }

  if (responseType === 'arraybuffer') {
    return new TextEncoder().encode(bodyText).buffer;
  }

  if (responseType === '' || responseType === 'text') {
    return bodyText;
  }

  throw new Error(`Unsupported XHR responseType "${responseType}"`);
}

class CloudhoodXMLHttpRequest extends OriginalXMLHttpRequest {
  #method = 'GET';
  #url = '';
  #async = true;
  #syntheticHeaders = 'content-type: application/json\r\n';
  #usedOpenFallbackMethod = false;

  open(method: string, url: string | URL, async?: boolean, username?: string | null, password?: string | null): void {
    this.#method = String(method);
    this.#url = typeof url === 'string' ? url : url.href;
    this.#async = async !== false;

    const requestUrl = absolutizeRequestUrl(this.#url, document.baseURI);
    const matchingOverride = findMatchingResponseOverride(
      activeOverrides,
      requestUrl,
      this.#method,
      compiledRegexByIndex,
    );
    const methodForNativeOpen =
      matchingOverride && doesXhrOpenRejectMethod(this.#method) ? XHR_OPEN_FALLBACK_METHOD : method;

    this.#usedOpenFallbackMethod = methodForNativeOpen !== method;

    if (async === undefined) {
      super.open(methodForNativeOpen, url);
      return;
    }

    super.open(methodForNativeOpen, url, async, username, password);
  }

  send(body?: Document | XMLHttpRequestBodyInit | null): void {
    const requestUrl = absolutizeRequestUrl(this.#url, document.baseURI);
    const matchingOverride = findMatchingResponseOverride(
      activeOverrides,
      requestUrl,
      this.#method,
      compiledRegexByIndex,
    );

    if (!matchingOverride && this.#usedOpenFallbackMethod) {
      const captureId = tryStartCapture(requestUrl, this.#method);
      postCaptureFailed(captureId);
      throw createUnsupportedXhrMethodError(this.#method);
    }

    const captureId = tryStartCapture(requestUrl, this.#method);
    attachXhrCaptureListeners(this, captureId);

    if (!matchingOverride) {
      super.send(body);
      return;
    }

    try {
      this.#applySyntheticResponse(matchingOverride, requestUrl);
    } catch (error) {
      postApplyError(matchingOverride.id, error instanceof Error ? error.message : 'Failed to synthesize XHR response');

      if (this.#usedOpenFallbackMethod) {
        postCaptureFailed(captureId);
        throw createUnsupportedXhrMethodError(this.#method);
      }

      super.send(body);
    }
  }

  #applySyntheticResponse(override: ResponseOverride, requestUrl: string) {
    const statusText = getStatusText(override.statusCode);
    const response = createSyntheticXhrBody(override, this.responseType);
    const responseText = isNullBodyStatus(override.statusCode) ? '' : override.responseBody;

    Object.defineProperty(this, 'readyState', { configurable: true, get: () => OriginalXMLHttpRequest.DONE });
    Object.defineProperty(this, 'status', { configurable: true, get: () => override.statusCode });
    Object.defineProperty(this, 'statusText', { configurable: true, get: () => statusText });
    Object.defineProperty(this, 'responseURL', { configurable: true, get: () => requestUrl });
    Object.defineProperty(this, 'response', { configurable: true, get: () => response });
    Object.defineProperty(this, 'responseText', {
      configurable: true,
      get: () => {
        if (this.responseType !== '' && this.responseType !== 'text') {
          throw new DOMException('Failed to read the \'responseText\' property from \'XMLHttpRequest\'');
        }

        return responseText;
      },
    });

    this.getAllResponseHeaders = () => this.#syntheticHeaders;
    this.getResponseHeader = name => (name.toLowerCase() === 'content-type' ? 'application/json' : null);

    const dispatchSyntheticEvents = () => {
      this.dispatchEvent(new Event('readystatechange'));
      this.dispatchEvent(new ProgressEvent('load'));
      this.dispatchEvent(new ProgressEvent('loadend'));
    };

    if (this.#async) {
      setTimeout(dispatchSyntheticEvents, 0);
      return;
    }

    dispatchSyntheticEvents();
  }
}

window.XMLHttpRequest = CloudhoodXMLHttpRequest;

window.addEventListener('message', event => {
  if (event.source !== window || !isResponseOverridesPageMessage(event.data)) {
    return;
  }

  activeOverrides = event.data.overrides;
  compiledRegexByIndex = compileOverrideRegexes(activeOverrides);

  compiledRegexByIndex.forEach((compiledRegex, index) => {
    const override = activeOverrides[index];

    if (override && override.matchType === 'regex' && compiledRegex === null) {
      postApplyError(override.id, 'Invalid regular expression');
    }
  });
});
