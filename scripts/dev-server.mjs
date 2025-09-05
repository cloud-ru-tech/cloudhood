#!/usr/bin/env node

import { spawn } from 'child_process';
import { existsSync, watch } from 'fs';
import { WebSocketServer } from 'ws';

const PORT = 3333;
const WATCH_DIR = 'build/chrome';

let wss = null;
let clients = new Set();
let viteProcess = null;
let reloadTimeout = null;

// Цвета для логов
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(prefix, message, color = colors.reset) {
  console.log(`${color}[${prefix}]${colors.reset} ${message}`);
}

function createWebSocketServer() {
  try {
    if (wss) {
      wss.close();
    }

    wss = new WebSocketServer({
      port: PORT,
      perMessageDeflate: false
    });

    log('WS', `🔄 WebSocket server started on port ${PORT}`, colors.blue);

    wss.on('connection', (ws) => {
      clients.add(ws);
      log('WS', `📱 Client connected (${clients.size} total)`, colors.green);

      ws.on('close', () => {
        clients.delete(ws);
        log('WS', `📱 Client disconnected (${clients.size} total)`, colors.yellow);
      });

      ws.on('error', (error) => {
        log('WS', `❌ Client error: ${error.message}`, colors.red);
        clients.delete(ws);
      });
    });

    wss.on('error', (error) => {
      log('WS', `❌ Server error: ${error.message}`, colors.red);
      // Перезапускаем сервер через 1 секунду
      setTimeout(createWebSocketServer, 1000);
    });

    return true;
  } catch (error) {
    log('WS', `❌ Failed to create WebSocket server: ${error.message}`, colors.red);
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
        log('WS', `❌ Error sending message: ${error.message}`, colors.red);
        clients.delete(client);
      }
    } else {
      clients.delete(client);
    }
  });

  if (sentCount > 0) {
    log('WS', `🔄 Sent reload signal to ${sentCount} client(s)`, colors.cyan);
  }
}

function startViteBuild() {
  if (viteProcess) {
    viteProcess.kill();
  }

  log('BUILD', '🚀 Starting Vite build process...', colors.green);

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
            log('BUILD', line, colors.green);
          }
        });
      }
    });

    viteProcess.stderr.on('data', (data) => {
      const output = data.toString().trim();
      if (output) {
        output.split('\n').forEach(line => {
          if (line.trim()) {
            log('BUILD', line, colors.red);
          }
        });
      }
    });

    viteProcess.on('close', (code) => {
      if (code !== 0) {
        log('BUILD', `❌ Vite process exited with code ${code}`, colors.red);
        // Перезапускаем через 2 секунды
        setTimeout(startViteBuild, 2000);
      }
    });

    viteProcess.on('error', (error) => {
      log('BUILD', `❌ Vite process error: ${error.message}`, colors.red);
      // Перезапускаем через 2 секунды
      setTimeout(startViteBuild, 2000);
    });
  }
}

function startFileWatcher() {
  if (!existsSync(WATCH_DIR)) {
    log('WS', `⏳ Waiting for build directory: ${WATCH_DIR}`, colors.yellow);
    setTimeout(startFileWatcher, 1000);
    return;
  }

  log('WS', `👀 Watching for changes in ${WATCH_DIR}`, colors.blue);

  const watcher = watch(WATCH_DIR, { recursive: true }, (eventType, filename) => {
    if (filename && (filename.endsWith('.js') || filename.endsWith('.html') || filename.endsWith('.json'))) {
      log('WS', `📁 File changed: ${filename}`, colors.cyan);

      // Дебаунс для предотвращения множественных перезагрузок
      if (reloadTimeout) {
        clearTimeout(reloadTimeout);
      }

      reloadTimeout = setTimeout(() => {
        // Проверяем, что манифест доступен перед отправкой сигнала
        if (existsSync(`${WATCH_DIR}/manifest.json`)) {
          notifyClients();
        } else {
          log('WS', '⚠️ Manifest not ready, delaying reload...', colors.yellow);
          // Повторяем проверку через 500мс
          setTimeout(() => {
            if (existsSync(`${WATCH_DIR}/manifest.json`)) {
              notifyClients();
            } else {
              log('WS', '❌ Manifest still not available, skipping reload', colors.red);
            }
          }, 500);
        }
        reloadTimeout = null;
      }, 1500); // Увеличили до 1.5 секунд для большей стабильности
    }
  });

  watcher.on('error', (error) => {
    log('WS', `❌ File watcher error: ${error.message}`, colors.red);
    // Перезапускаем watcher через 1 секунду
    setTimeout(startFileWatcher, 1000);
  });

  return watcher;
}

// Обработка сигналов завершения
function cleanup() {
  log('MAIN', '🛑 Shutting down...', colors.yellow);

  if (reloadTimeout) {
    clearTimeout(reloadTimeout);
  }

  if (viteProcess) {
    viteProcess.kill();
  }

  if (wss) {
    wss.close();
  }

  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

log('MAIN', '🚀 Starting development server...', colors.bright);

createWebSocketServer();
startViteBuild();
startFileWatcher();

log('MAIN', '✅ Development server is running!', colors.green);
log('MAIN', '📝 Press Ctrl+C to stop', colors.yellow);