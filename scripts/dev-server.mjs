#!/usr/bin/env node

import { spawn } from 'child_process';
import { existsSync, watch, copyFileSync } from 'fs';
import { WebSocketServer } from 'ws';
import pino from 'pino';

const PORT = process.env.WS_PORT ? parseInt(process.env.WS_PORT, 10) : 3333;
const WATCH_DIR = 'build/chrome';

// Logger setup
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
let contentMainViteProcess = null;
let contentBridgeViteProcess = null;
let reloadTimeout = null;
let mainBuildReady = false;
let backgroundBuildReady = false;
let isCheckingFiles = false;

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
      // Restart the server after 1 second
      setTimeout(createWebSocketServer, 1000);
    });

    return true;
  } catch (error) {
    logger.error(`❌ Failed to create WebSocket server: ${error.message}`);
    // Restart the server after 2 seconds
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

function checkAndReload() {
  // Guard against multiple concurrent calls
  if (isCheckingFiles) {
    return;
  }
  
  isCheckingFiles = true;
  
  // Give the file system time to flush files
  setTimeout(() => {
    // Check that all critical files are ready before sending a signal
    const criticalFiles = [
      `${WATCH_DIR}/manifest.json`,
      `${WATCH_DIR}/popup.bundle.js`,
      `${WATCH_DIR}/background.bundle.js`,
      `${WATCH_DIR}/response-overrides-main.bundle.js`,
      `${WATCH_DIR}/response-overrides-bridge.bundle.js`
    ];

    const missingFiles = criticalFiles.filter(file => !existsSync(file));
    const allFilesReady = missingFiles.length === 0;

    if (allFilesReady) {
      notifyClients();
      mainBuildReady = false;
      backgroundBuildReady = false;
      isCheckingFiles = false;
    } else {
      logger.warn(`⚠️ Critical files not ready, missing: ${missingFiles.map(f => f.split('/').pop()).join(', ')}`);
      // Retry with exponential backoff
      let attempts = 0;
      const maxAttempts = 10;

      const checkFiles = () => {
        attempts++;
        const stillMissing = criticalFiles.filter(file => !existsSync(file));
        const ready = stillMissing.length === 0;

        if (ready) {
          notifyClients();
          mainBuildReady = false;
          backgroundBuildReady = false;
          isCheckingFiles = false;
        } else if (attempts < maxAttempts) {
          const delay = Math.min(500 * Math.pow(2, attempts - 1), 3000);
          logger.warn(`⚠️ Attempt ${attempts}/${maxAttempts}, retrying in ${delay}ms... Missing: ${stillMissing.map(f => f.split('/').pop()).join(', ')}`);
          setTimeout(checkFiles, delay);
        } else {
          logger.error(`❌ Critical files still not available after maximum attempts, skipping reload. Missing: ${stillMissing.map(f => f.split('/').pop()).join(', ')}`);
          mainBuildReady = false;
          backgroundBuildReady = false;
          isCheckingFiles = false;
        }
      };

      setTimeout(checkFiles, 500);
    }
  }, 1000); // Increase delay to allow files to be written to disk
}

function startViteBuild() {
  if (viteProcess) {
    viteProcess.kill();
  }

  mainBuildReady = false;
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
            // Track completion of the popup build
            if (line.includes('built in') && !line.includes('[BG]')) {
              mainBuildReady = true;
              logger.info('✅ Main build completed');
              // If both builds are ready, check files
              if (mainBuildReady && backgroundBuildReady) {
                setTimeout(checkAndReload, 500);
              }
            }
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
        // Restart after 2 seconds
        setTimeout(startViteBuild, 2000);
      }
    });

    viteProcess.on('error', (error) => {
      logger.error(`❌ Vite process error: ${error.message}`);
      // Restart after 2 seconds
      setTimeout(startViteBuild, 2000);
    });
  }
}

function startBackgroundViteBuild() {
  if (backgroundViteProcess) {
    backgroundViteProcess.kill();
  }

  backgroundBuildReady = false;
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
            // Track completion of the background build
            if (line.includes('built in')) {
              backgroundBuildReady = true;
              logger.info('✅ Background build completed');
              // If both builds are ready, check files
              if (mainBuildReady && backgroundBuildReady) {
                setTimeout(checkAndReload, 500);
              }
            }
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
        // Restart after 2 seconds
        setTimeout(startBackgroundViteBuild, 2000);
      }
    });

    backgroundViteProcess.on('error', (error) => {
      logger.error(`❌ Background Vite process error: ${error.message}`);
      // Restart after 2 seconds
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

  const watcher = watch(WATCH_DIR, { recursive: true }, (eventType, filename) => {
    if (filename && (filename.endsWith('.js') || filename.endsWith('.html') || filename.endsWith('.json'))) {
      logger.info(`📁 File changed: ${filename}`);

      // Debounce to prevent multiple reloads
      if (reloadTimeout) {
        clearTimeout(reloadTimeout);
      }

      reloadTimeout = setTimeout(() => {
        // Check files only when both builds are finished
        if (mainBuildReady && backgroundBuildReady) {
          checkAndReload();
        } else {
          logger.info(`⏳ Waiting for builds to complete... Main: ${mainBuildReady}, Background: ${backgroundBuildReady}`);
        }
        reloadTimeout = null;
      }, 1000);
    }
  });

  watcher.on('error', (error) => {
    logger.error(`❌ File watcher error: ${error.message}`);
    // Restart the watcher after 1 second
    setTimeout(startFileWatcher, 1000);
  });

  return watcher;
}

// Handle shutdown signals
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

  if (contentMainViteProcess) {
    contentMainViteProcess.kill();
  }

  if (contentBridgeViteProcess) {
    contentBridgeViteProcess.kill();
  }

  if (wss) {
    wss.close();
  }

  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

logger.info('🚀 Starting development server...');

function startContentViteBuild(entry, processRefName) {
  const existingProcess = processRefName === 'main' ? contentMainViteProcess : contentBridgeViteProcess;
  if (existingProcess) {
    existingProcess.kill();
  }

  const child = spawn('npx', ['vite', 'build', '--watch', '--config', 'vite.content.config.ts', '--mode', 'development'], {
    env: { ...process.env, BROWSER: 'chrome', CONTENT_ENTRY: entry },
    stdio: 'pipe'
  });

  if (processRefName === 'main') {
    contentMainViteProcess = child;
  } else {
    contentBridgeViteProcess = child;
  }

  child.stdout.on('data', (data) => {
    const output = data.toString().trim();
    if (output) {
      output.split('\n').forEach(line => {
        if (line.trim()) {
          logger.info(`[CS:${entry}] ${line}`);
        }
      });
    }
  });

  child.stderr.on('data', (data) => {
    const output = data.toString().trim();
    if (output) {
      output.split('\n').forEach(line => {
        if (line.trim()) {
          logger.error(`[CS:${entry}] ${line}`);
        }
      });
    }
  });
}

createWebSocketServer();
startViteBuild();
startBackgroundViteBuild();
startContentViteBuild('main', 'main');
startContentViteBuild('bridge', 'bridge');
startFileWatcher();

// Initial file check after a short delay for the first build
setTimeout(() => {
  if (mainBuildReady && backgroundBuildReady) {
    checkAndReload();
  }
}, 5000);

logger.info('✅ Development server is running!');
logger.info('📝 Press Ctrl+C to stop');