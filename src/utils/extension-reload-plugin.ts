import type { Plugin } from 'vite';
import WebSocket, { WebSocketServer } from 'ws';

export const extensionReloadPlugin = (): Plugin => {
  let wss: WebSocketServer | null = null;

  return {
    name: 'extension-reload',
    configureServer(server) {
      if (server.config.command === 'serve' || server.config.mode === 'development') {
        wss = new WebSocketServer({ port: 3333 });

        wss.on('connection', (ws: WebSocket) => {
          // eslint-disable-next-line no-console
          console.log('Extension reload client connected');

          ws.on('close', () => {
            // eslint-disable-next-line no-console
            console.log('Extension reload client disconnected');
          });
        });
      }
    },

    handleHotUpdate({ file }) {
      if (wss) {
        wss.clients.forEach((client: WebSocket) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: 'reload', file }));
          }
        });
      }
    },

    buildStart() {
      // Уведомляем о начале сборки в watch mode
      if (wss) {
        wss.clients.forEach((client: WebSocket) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: 'reload' }));
          }
        });
      }
    },
  };
};
