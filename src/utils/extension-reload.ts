// Utility for automatic browser extension reload in development mode
let reconnectAttempts = 0;
const maxReconnectAttempts = 10;
let reconnectTimeout: NodeJS.Timeout | null = null;

export const enableExtensionReload = (): void => {
  if (process.env.NODE_ENV !== 'development') {
    console.warn('🔄 Extension reload is only available in development mode');
    return;
  }

  // Clear the previous reconnect timeout
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }

  try {
    // eslint-disable-next-line no-console
    console.log('🔄 Attempting to connect to WebSocket server...');
    const ws = new WebSocket('ws://localhost:3333');

    ws.onmessage = event => {
      try {
        const message = JSON.parse(event.data);
        // eslint-disable-next-line no-console
        console.log('🔄 Received reload message:', message);

        if (message.type === 'reload') {
          // eslint-disable-next-line no-console
          console.log('🔄 Reloading extension...');

          // Add a small delay to let the build finish
          setTimeout(() => {
            // Check if chrome.runtime.reload is available
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const chromeAPI = (globalThis as any).chrome;
            if (chromeAPI && chromeAPI.runtime && chromeAPI.runtime.reload) {
              try {
                chromeAPI.runtime.reload();
              } catch (error) {
                console.error('❌ Error during extension reload:', error);
                // Fallback - reload via location
                if (typeof window !== 'undefined') {
                  window.location.reload();
                }
              }
            } else {
              console.error('❌ chrome.runtime.reload is not available');
              // Alternative - reload via location
              if (typeof window !== 'undefined') {
                window.location.reload();
              }
            }
          }, 200); // Wait 200ms for file writes to finish
        }
      } catch (error) {
        console.error('❌ Error parsing WebSocket message:', error);
      }
    };

    ws.onopen = () => {
      // eslint-disable-next-line no-console
      console.log('✅ Extension reload WebSocket connected successfully');
      reconnectAttempts = 0; // Reset attempts counter on successful connect
    };

    ws.onclose = event => {
      // eslint-disable-next-line no-console
      console.log(`🔌 Extension reload WebSocket disconnected (code: ${event.code}, reason: ${event.reason})`);

      if (process.env.NODE_ENV === 'development' && reconnectAttempts < maxReconnectAttempts) {
        reconnectAttempts++;
        const delay = Math.min(1000 * reconnectAttempts, 5000); // Increase delay, but no more than 5 seconds

        // eslint-disable-next-line no-console
        console.log(`🔄 Attempting to reconnect in ${delay}ms (attempt ${reconnectAttempts}/${maxReconnectAttempts})`);

        reconnectTimeout = setTimeout(() => {
          enableExtensionReload();
        }, delay);
      } else if (reconnectAttempts >= maxReconnectAttempts) {
        console.error('❌ Max reconnection attempts reached. Please restart the dev server.');
      }
    };

    ws.onerror = error => {
      console.error('❌ Extension reload WebSocket error:', error);
    };
  } catch (error) {
    console.error('❌ Failed to create WebSocket connection:', error);

    if (process.env.NODE_ENV === 'development' && reconnectAttempts < maxReconnectAttempts) {
      reconnectAttempts++;
      const delay = Math.min(1000 * reconnectAttempts, 5000);

      // eslint-disable-next-line no-console
      console.log(`🔄 Retrying connection in ${delay}ms (attempt ${reconnectAttempts}/${maxReconnectAttempts})`);

      reconnectTimeout = setTimeout(() => {
        enableExtensionReload();
      }, delay);
    }
  }
};
