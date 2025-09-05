import type { Plugin } from 'vite';

export const extensionReloadPlugin = (): Plugin => {
  let notifyClients: ((file?: string) => void) | null = null;

  // Функция для отправки уведомления через WebSocket
  const sendReloadNotification = (file?: string) => {
    try {
      // Используем встроенный WebSocket браузера
      const WebSocket = globalThis.WebSocket || require('ws');
      const port = process.env.WS_PORT ? parseInt(process.env.WS_PORT, 10) : 3333;
      const ws = new WebSocket(`ws://localhost:${port}`);

      ws.onopen = () => {
        ws.send(JSON.stringify({ type: 'reload', file }));
        ws.close();
      };

      ws.onerror = () => {
        // Игнорируем ошибки подключения - сервер может быть не запущен
      };
    } catch (_error) {
      // Игнорируем ошибки - сервер может быть не запущен
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
      // Уведомляем о завершении сборки
      if (notifyClients && process.env.NODE_ENV === 'development') {
        setTimeout(() => {
          notifyClients?.();
          // eslint-disable-next-line no-console
          console.log('🔄 Extension build completed - reload signal sent');
        }, 100); // Небольшая задержка для завершения записи файлов
      }
    },

    handleHotUpdate({ file }) {
      if (notifyClients) {
        notifyClients(file);
      }
    },
  };
};
