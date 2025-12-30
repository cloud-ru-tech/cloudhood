/* eslint-disable no-console */
(function () {
  // Configuration
  let activeOverrides = [];

  // Store original functions
  const originalFetch = window.fetch;
  const OriginalXHR = window.XMLHttpRequest;

  const log = (title, data) => {
    console.groupCollapsed(`%c[Cloudhood] ${title}`, 'color: #00aa00; font-weight: bold;');
    console.log('Data:', data);
    console.trace('Stack Trace');
    console.groupEnd();
  }


  // Listen for updates from the extension
  window.addEventListener('message', (event) => {
    if (event.source !== window) return;

    if (event.data?.type === 'CLOUDHOOD_UPDATE_OVERRIDES') {
      activeOverrides = event.data.overrides.map((o) => ({
        urlPattern: o.urlPattern,
        responseContent: o.responseContent,
      }));
    }
  });

  // Patch Fetch
  window.fetch = async (input, init) => {
    let url;

    if (typeof input === 'string') {
      url = input;
    } else if (input instanceof URL) {
      url = input.toString();
    } else if (input instanceof Request) {
      url = input.url;
    } else {
      url = String(input);
    }

    const override = activeOverrides.find(o => url.includes(o.urlPattern));

    if (override) {
      try {
        const parsedResponse = JSON.parse(override.responseContent);
        
        log(`Mocked Fetch: ${url}`, {
          url,
          response: parsedResponse,
          originalInput: input,
          originalInit: init
        });

        return new Response(override.responseContent, {
          status: 200,
          statusText: 'OK',
          headers: {
            'content-type': 'application/json',
          }
        });
      } catch (error) {
        console.warn('[Cloudhood] Invalid JSON in override for URL:', url, error);
        return originalFetch(input, init);
      }
    }

    return originalFetch(input, init);
  };

  // Patch XHR
  window.XMLHttpRequest = class CloudhoodXHR extends OriginalXHR {
    open(method, url, async = true, username = null, password = null) {
      this._method = method;
      this._url = url.toString();

      this._override = activeOverrides.find(o => this._url.includes(o.urlPattern));

      super.open(method, url, async, username, password);
    }

    send(body) {
      if (this._override) {
        try {
          const parsedResponse = JSON.parse(this._override.responseContent);
          
          log(`Mocked XHR: ${this._url}`, {
            url: this._url,
            method: this._method,
            response: parsedResponse,
            body
          });

          setTimeout(() => {
            const responseData = this._override.responseContent;

            Object.defineProperty(this, 'readyState', { value: 4, writable: false });
            Object.defineProperty(this, 'status', { value: 200, writable: false });
            Object.defineProperty(this, 'statusText', { value: 'OK', writable: false });
            Object.defineProperty(this, 'responseText', { value: responseData, writable: false });
            Object.defineProperty(this, 'response', { value: responseData, writable: false });
            Object.defineProperty(this, 'responseURL', { value: this._url, writable: false });

            this.dispatchEvent(new Event('readystatechange'));

            const progressEvent = new ProgressEvent('load', {
              loaded: responseData.length,
              total: responseData.length,
              lengthComputable: true
            });

            this.dispatchEvent(progressEvent);
            this.dispatchEvent(new ProgressEvent('loadend'));

            if (this.onreadystatechange) {
              this.onreadystatechange(new Event('readystatechange'));
            }
            if (this.onload) {
              this.onload(progressEvent);
            }
            if (this.onloadend) {
              this.onloadend(new ProgressEvent('loadend'));
            }
          }, 10);

          return;
        } catch (error) {
          console.warn('[Cloudhood] Invalid JSON in override for XHR URL:', this._url, error);
        }
      }

      super.send(body);
    }
  };
})();
