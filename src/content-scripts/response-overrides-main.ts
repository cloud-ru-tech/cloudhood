import { CLOUDHOOD_RESPONSE_OVERRIDE_APPLY_ERROR_MESSAGE } from '#shared/constants';
import { ResponseOverride } from '#shared/types/responseOverride';
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

function postApplyError(overrideId: number, reason: string) {
  const message: ResponseOverrideApplyErrorPageMessage = {
    type: CLOUDHOOD_RESPONSE_OVERRIDE_APPLY_ERROR_MESSAGE,
    overrideId,
    reason,
  };

  window.postMessage(message, window.location.origin);
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
  try {
    const requestUrl = resolveFetchUrl(input);
    const requestMethod = resolveFetchMethod(input, init);
    const matchingOverride = findMatchingResponseOverride(
      activeOverrides,
      requestUrl,
      requestMethod,
      compiledRegexByIndex,
    );

    if (!matchingOverride) {
      return originalFetch(input, init);
    }

    try {
      return Promise.resolve(createSyntheticResponse(matchingOverride));
    } catch (error) {
      postApplyError(matchingOverride.id, error instanceof Error ? error.message : 'Failed to synthesize fetch response');
      return originalFetch(input, init);
    }
  } catch {
    return originalFetch(input, init);
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
      throw createUnsupportedXhrMethodError(this.#method);
    }

    if (!matchingOverride) {
      super.send(body);
      return;
    }

    try {
      this.#applySyntheticResponse(matchingOverride, requestUrl);
    } catch (error) {
      postApplyError(matchingOverride.id, error instanceof Error ? error.message : 'Failed to synthesize XHR response');

      if (this.#usedOpenFallbackMethod) {
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
