import { watch } from 'fs';
import { WebSocketServer } from 'ws';

const PORT = 3333;
const WATCH_DIR = 'build/chrome';

let wss = null;
let clients = new Set();

function createServer() {
  try {
    wss = new WebSocketServer({
      port: PORT,
      perMessageDeflate: false
    });

    console.log(`🔄 Extension reload server started on port ${PORT}`);

    wss.on('connection', (ws) => {
      clients.add(ws);
      console.log(`📱 Client connected (${clients.size} total)`);

      ws.on('close', () => {
        clients.delete(ws);
        console.log(`📱 Client disconnected (${clients.size} total)`);
      });

      ws.on('error', (error) => {
        console.error('❌ Client error:', error.message);
        clients.delete(ws);
      });
    });

    wss.on('error', (error) => {
      console.error('❌ Server error:', error.message);
    });

    // Отслеживаем изменения в папке build с дебаунсом
    let reloadTimeout = null;
    const watcher = watch(WATCH_DIR, { recursive: true }, (eventType, filename) => {
      if (filename && (filename.endsWith('.js') || filename.endsWith('.html') || filename.endsWith('.json'))) {
        console.log(`📁 File changed: ${filename}`);

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

    console.log(`👀 Watching for changes in ${WATCH_DIR}`);

    // Обработка ошибок watcher
    watcher.on('error', (error) => {
      console.error('❌ File watcher error:', error.message);
    });

    // Обработка сигналов завершения
    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down server...');
      watcher.close();
      wss.close();
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      console.log('\n🛑 Shutting down server...');
      watcher.close();
      wss.close();
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Failed to create server:', error.message);
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
        console.error('❌ Error sending message:', error.message);
        clients.delete(client);
      }
    } else {
      clients.delete(client);
    }
  });

  if (clients.size > 0) {
    console.log(`🔄 Sent reload signal to ${clients.size} clients`);
  }
}

createServer();