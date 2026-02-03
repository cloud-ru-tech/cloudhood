import type { Plugin } from 'vite';

export const extensionReloadPlugin = (): Plugin => {
  let notifyClients: ((file?: string) => void) | null = null;

  // Function to send a notification via WebSocket
  const sendReloadNotification = (file?: string) => {
    try {
      // Use the built-in browser WebSocket
      const WebSocket = globalThis.WebSocket || require('ws');
      const port = process.env.WS_PORT ? parseInt(process.env.WS_PORT, 10) : 3333;
      const ws = new WebSocket(`ws://localhost:${port}`);

      ws.onopen = () => {
        ws.send(JSON.stringify({ type: 'reload', file }));
        ws.close();
      };

      ws.onerror = () => {
        // Ignore connection errors - the server may not be running
      };
    } catch (_error) {
      // Ignore errors - the server may not be running
    }
  };

  return {
    name: 'extension-reload',

    buildStart() {
      if (process.env.NODE_ENV === 'development') {
        notifyClients = sendReloadNotification;
        // eslint-disable-next-line no-console
        console.log('🔄 Extension reload plugin initialized');
      }
    },

    buildEnd() {
      // Notify on build completion
      if (notifyClients && process.env.NODE_ENV === 'development') {
        setTimeout(() => {
          notifyClients?.();
          // eslint-disable-next-line no-console
          console.log('🔄 Extension build completed - reload signal sent');
        }, 100); // Small delay to let file writes finish
      }
    },

    handleHotUpdate({ file }) {
      if (notifyClients) {
        notifyClients(file);
      }
    },
  };
};
