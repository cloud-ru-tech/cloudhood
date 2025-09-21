#!/usr/bin/env node

import { spawn } from 'child_process';
import { existsSync, watch, copyFileSync } from 'fs';
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
let viteProcess = null;
let backgroundViteProcess = null;
let reloadTimeout = null;
let rootWatcher = null;

function createWebSocketServer() {
  try {
    if (wss) {
      wss.close();
    }

    wss = new WebSocketServer({
      port: PORT,
      perMessageDeflate: false
    });

    logger.info(`🔄 WebSocket server started on port ${PORT}`);

    wss.on('connection', (ws) => {
      clients.add(ws);
      logger.info(`📱 Client connected (${clients.size} total)`);

      ws.on('close', () => {
        clients.delete(ws);
        logger.info(`📱 Client disconnected (${clients.size} total)`);
      });

      ws.on('error', (error) => {
        logger.error(`❌ Client error: ${error.message}`);
        clients.delete(ws);
      });
    });

    wss.on('error', (error) => {
      logger.error(`❌ Server error: ${error.message}`);
      // Перезапускаем сервер через 1 секунду
      setTimeout(createWebSocketServer, 1000);
    });

    return true;
  } catch (error) {
    logger.error(`❌ Failed to create WebSocket server: ${error.message}`);
    // Перезапускаем сервер через 2 секунды
    setTimeout(createWebSocketServer, 2000);
    return false;
  }
}

function notifyClients() {
  const message = JSON.stringify({ type: 'reload', timestamp: Date.now() });
  let sentCount = 0;

  clients.forEach((client) => {
    if (client.readyState === 1) { // WebSocket.OPEN
      try {
        client.send(message);
        sentCount++;
      } catch (error) {
        logger.error(`❌ Error sending message: ${error.message}`);
        clients.delete(client);
      }
    } else {
      clients.delete(client);
    }
  });

  if (sentCount > 0) {
    logger.info(`🔄 Sent reload signal to ${sentCount} client(s)`);
  }
}

function startViteBuild() {
  if (viteProcess) {
    viteProcess.kill();
  }

  logger.info('🚀 Starting Vite build process...');

  viteProcess = spawn('npx', ['vite', 'build', '--watch', '--mode', 'development'], {
    env: { ...process.env, BROWSER: 'chrome' },
    stdio: 'pipe'
  });

  if (viteProcess) {
    viteProcess.stdout.on('data', (data) => {
      const output = data.toString().trim();
      if (output) {
        output.split('\n').forEach(line => {
          if (line.trim()) {
            logger.info(line);
          }
        });
      }
    });

    viteProcess.stderr.on('data', (data) => {
      const output = data.toString().trim();
      if (output) {
        output.split('\n').forEach(line => {
          if (line.trim()) {
            logger.error(line);
          }
        });
      }
    });

    viteProcess.on('close', (code) => {
      if (code !== 0) {
        logger.error(`❌ Vite process exited with code ${code}`);
        // Перезапускаем через 2 секунды
        setTimeout(startViteBuild, 2000);
      }
    });

    viteProcess.on('error', (error) => {
      logger.error(`❌ Vite process error: ${error.message}`);
      // Перезапускаем через 2 секунды
      setTimeout(startViteBuild, 2000);
    });
  }
}

function startBackgroundViteBuild() {
  if (backgroundViteProcess) {
    backgroundViteProcess.kill();
  }

  logger.info('🚀 Starting Background Vite build process...');

  backgroundViteProcess = spawn('npx', ['vite', 'build', '--watch', '--config', 'vite.background.config.ts'], {
    env: { ...process.env, BROWSER: 'chrome' },
    stdio: 'pipe'
  });

  if (backgroundViteProcess) {
    backgroundViteProcess.stdout.on('data', (data) => {
      const output = data.toString().trim();
      if (output) {
        output.split('\n').forEach(line => {
          if (line.trim()) {
            logger.info(`[BG] ${line}`);
          }
        });
      }
    });

    backgroundViteProcess.stderr.on('data', (data) => {
      const output = data.toString().trim();
      if (output) {
        output.split('\n').forEach(line => {
          if (line.trim()) {
            logger.error(`[BG] ${line}`);
          }
        });
      }
    });

    backgroundViteProcess.on('close', (code) => {
      if (code !== 0) {
        logger.error(`❌ Background Vite process exited with code ${code}`);
        // Перезапускаем через 2 секунды
        setTimeout(startBackgroundViteBuild, 2000);
      }
    });

    backgroundViteProcess.on('error', (error) => {
      logger.error(`❌ Background Vite process error: ${error.message}`);
      // Перезапускаем через 2 секунды
      setTimeout(startBackgroundViteBuild, 2000);
    });
  }
}

function startFileWatcher() {
  if (!existsSync(WATCH_DIR)) {
    logger.warn(`⏳ Waiting for build directory: ${WATCH_DIR}`);
    setTimeout(startFileWatcher, 1000);
    return;
  }

  logger.info(`👀 Watching for changes in ${WATCH_DIR}`);

  // Also watch root build directory for background.bundle.js
  const rootBuildDir = 'build';
  if (existsSync(rootBuildDir)) {
    logger.info(`👀 Also watching root build directory: ${rootBuildDir}`);

    rootWatcher = watch(rootBuildDir, (eventType, filename) => {
      if (filename === 'background.bundle.js') {
        logger.info(`📁 Root build file changed: ${filename}`);

        // Copy background.bundle.js to chrome directory
        const src = `${rootBuildDir}/background.bundle.js`;
        const dest = `${WATCH_DIR}/background.bundle.js`;

        if (existsSync(src)) {
          copyFileSync(src, dest);
          logger.info('📋 Background bundle copied to chrome directory');
        }
      }
    });

    rootWatcher.on('error', (error) => {
      logger.error(`❌ Root build watcher error: ${error.message}`);
    });
  }

  const watcher = watch(WATCH_DIR, { recursive: true }, (eventType, filename) => {
    if (filename && (filename.endsWith('.js') || filename.endsWith('.html') || filename.endsWith('.json'))) {
        logger.info(`📁 File changed: ${filename}`);

      // Дебаунс для предотвращения множественных перезагрузок
      if (reloadTimeout) {
        clearTimeout(reloadTimeout);
      }

      reloadTimeout = setTimeout(() => {
        // Проверяем готовность всех критических файлов перед отправкой сигнала
        const criticalFiles = [
          `${WATCH_DIR}/manifest.json`,
          `${WATCH_DIR}/popup.bundle.js`,
          `${WATCH_DIR}/background.bundle.js`
        ];

        const allFilesReady = criticalFiles.every(file => existsSync(file));

        if (allFilesReady) {
          notifyClients();
        } else {
          logger.warn('⚠️ Critical files not ready, delaying reload...');
          // Повторяем проверку с экспоненциальным backoff
          let attempts = 0;
          const maxAttempts = 10; // Увеличиваем количество попыток

          const checkFiles = () => {
            attempts++;
            const ready = criticalFiles.every(file => existsSync(file));

            if (ready) {
              notifyClients();
            } else if (attempts < maxAttempts) {
              const delay = Math.min(500 * Math.pow(2, attempts - 1), 3000); // Увеличиваем максимальную задержку
              logger.warn(`⚠️ Attempt ${attempts}/${maxAttempts}, retrying in ${delay}ms...`);
              setTimeout(checkFiles, delay);
            } else {
              logger.error('❌ Critical files still not available after maximum attempts, skipping reload');
            }
          };

          setTimeout(checkFiles, 1000); // Увеличиваем начальную задержку
        }
        reloadTimeout = null;
      }, 3000); // Увеличили до 3 секунд для большей стабильности
    }
  });

  watcher.on('error', (error) => {
    logger.error(`❌ File watcher error: ${error.message}`);
    // Перезапускаем watcher через 1 секунду
    setTimeout(startFileWatcher, 1000);
  });

  return watcher;
}

// Обработка сигналов завершения
function cleanup() {
  logger.info('🛑 Shutting down...');

  if (reloadTimeout) {
    clearTimeout(reloadTimeout);
  }

  if (viteProcess) {
    viteProcess.kill();
  }

  if (backgroundViteProcess) {
    backgroundViteProcess.kill();
  }

  if (wss) {
    wss.close();
  }

  // Close root watcher if it exists
  if (rootWatcher) {
    rootWatcher.close();
  }

  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

logger.info('🚀 Starting development server...');

createWebSocketServer();
startViteBuild();
startBackgroundViteBuild();
startFileWatcher();

logger.info('✅ Development server is running!');
logger.info('📝 Press Ctrl+C to stop');