import { WebSocketServer } from 'ws';
import pino from 'pino';

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
let isShuttingDown = false;

async function createServer() {
  try {
    const port = process.env.WS_PORT ? parseInt(process.env.WS_PORT, 10) : 3333;

    wss = new WebSocketServer({
      port,
      perMessageDeflate: false,
      clientTracking: true
    });

    logger.info(`🔄 Extension reload WebSocket server started on port ${port}`);

    wss.on('connection', (ws) => {
      logger.info('📱 Extension reload client connected');

      ws.on('close', () => {
        logger.info('📱 Extension reload client disconnected');
      });

      ws.on('error', (error) => {
        logger.error('❌ WebSocket client error:', error.message);
      });

      // Отправляем ping каждые 30 секунд для поддержания соединения
      const pingInterval = setInterval(() => {
        if (ws.readyState === 1) { // WebSocket.OPEN
          ws.ping();
        } else {
          clearInterval(pingInterval);
        }
      }, 30000);

      ws.on('close', () => {
        clearInterval(pingInterval);
      });
    });

    wss.on('error', (error) => {
      logger.error('❌ WebSocket server error:', error.message);
      if (!isShuttingDown) {
        logger.info('🔄 Attempting to restart WebSocket server in 2 seconds...');
        setTimeout(() => {
          if (!isShuttingDown) {
            createServer();
          }
        }, 2000);
      }
    });

    // Обработка сигналов для корректного завершения
    process.on('SIGINT', () => {
      isShuttingDown = true;
      logger.info('🛑 Shutting down WebSocket server...');
      if (wss) {
        wss.close(() => {
          process.exit(0);
        });
      } else {
        process.exit(0);
      }
    });

    process.on('SIGTERM', () => {
      isShuttingDown = true;
      logger.info('🛑 Shutting down WebSocket server...');
      if (wss) {
        wss.close(() => {
          process.exit(0);
        });
      } else {
        process.exit(0);
      }
    });

    // Обработка необработанных исключений
    process.on('uncaughtException', (error) => {
      logger.error('❌ Uncaught exception:', error.message);
      if (!isShuttingDown) {
        logger.info('🔄 Restarting WebSocket server...');
        setTimeout(() => {
          if (!isShuttingDown) {
            createServer();
          }
        }, 1000);
      }
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('❌ Unhandled rejection at:', promise, 'reason:', reason);
    });

  } catch (error) {
    logger.error('❌ Failed to create WebSocket server:', error.message);
    if (!isShuttingDown) {
      setTimeout(() => {
        if (!isShuttingDown) {
          createServer();
        }
      }, 2000);
    }
  }
}

// Функция для отправки сигнала перезагрузки всем подключенным клиентам
function notifyReload(file) {
  if (wss && wss.clients) {
    logger.info(`🔄 Sending reload signal to ${wss.clients.size} clients`);
    wss.clients.forEach((client) => {
      if (client.readyState === 1) { // WebSocket.OPEN
        try {
          client.send(JSON.stringify({ type: 'reload', file }));
        } catch (error) {
          logger.error('❌ Error sending reload signal:', error.message);
        }
      }
    });
  }
}

// Экспортируем функцию для использования в других модулях
global.notifyReload = notifyReload;

// Запускаем сервер
createServer();