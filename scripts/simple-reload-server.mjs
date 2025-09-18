import { watch } from 'fs';
import { WebSocketServer } from 'ws';
import pino from 'pino';

const PORT = process.env.WS_PORT ? parseInt(process.env.WS_PORT, 10) : 3333;
const WATCH_DIR = 'build/chrome';

// Настройка логгера
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss',
      ignore: 'pid,hostname'
    }
  }
});

let wss = null;
let clients = new Set();

function createServer() {
  try {
    wss = new WebSocketServer({
      port: PORT,
      perMessageDeflate: false
    });

    logger.info(`🔄 Extension reload server started on port ${PORT}`);

    wss.on('connection', (ws) => {
      clients.add(ws);
      logger.info(`📱 Client connected (${clients.size} total)`);

      ws.on('close', () => {
        clients.delete(ws);
        logger.info(`📱 Client disconnected (${clients.size} total)`);
      });

      ws.on('error', (error) => {
        logger.error('❌ Client error:', error.message);
        clients.delete(ws);
      });
    });

    wss.on('error', (error) => {
      logger.error('❌ Server error:', error.message);
    });

    // Отслеживаем изменения в папке build с дебаунсом
    let reloadTimeout = null;
    const watcher = watch(WATCH_DIR, { recursive: true }, (eventType, filename) => {
      if (filename && (filename.endsWith('.js') || filename.endsWith('.html') || filename.endsWith('.json'))) {
        logger.info(`📁 File changed: ${filename}`);

        // Дебаунс для предотвращения множественных перезагрузок
        if (reloadTimeout) {
          clearTimeout(reloadTimeout);
        }

        reloadTimeout = setTimeout(() => {
          notifyClients();
          reloadTimeout = null;
        }, 500); // Ждем 500мс после последнего изменения
      }
    });

    logger.info(`👀 Watching for changes in ${WATCH_DIR}`);

    // Обработка ошибок watcher
    watcher.on('error', (error) => {
      logger.error('❌ File watcher error:', error.message);
    });

    // Обработка сигналов завершения
    process.on('SIGINT', () => {
      logger.info('🛑 Shutting down server...');
      watcher.close();
      wss.close();
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      logger.info('🛑 Shutting down server...');
      watcher.close();
      wss.close();
      process.exit(0);
    });

  } catch (error) {
    logger.error('❌ Failed to create server:', error.message);
    process.exit(1);
  }
}

function notifyClients() {
  const message = JSON.stringify({ type: 'reload', timestamp: Date.now() });

  clients.forEach((client) => {
    if (client.readyState === 1) { // WebSocket.OPEN
      try {
        client.send(message);
      } catch (error) {
        logger.error('❌ Error sending message:', error.message);
        clients.delete(client);
      }
    } else {
      clients.delete(client);
    }
  });

  if (clients.size > 0) {
    logger.info(`🔄 Sent reload signal to ${clients.size} clients`);
  }
}

createServer();