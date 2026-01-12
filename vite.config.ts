import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

import react from '@vitejs/plugin-react';
import pino from 'pino';
import { defineConfig, type Plugin, type PluginOption } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import tsconfigPaths from 'vite-tsconfig-paths';

import { extensionReloadPlugin } from './src/utils/extension-reload-plugin';

// Настройка логгера
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss',
      ignore: 'pid,hostname',
    },
  },
});

const copyBrowserExtensionFiles = (targetBrowser: string, outDir: string, isDev: boolean = false): void => {
  logger.info({ outDir }, 'Copying browser extension files');

  // Ensure build directory exists
  mkdirSync(outDir, { recursive: true });

  // Copy index.html as popup.html
  const indexSrc = resolve(outDir, 'src/index.html');
  const popupDest = resolve(outDir, 'popup.html');

  if (existsSync(indexSrc)) {
    copyFileSync(indexSrc, popupDest);
  }

  // Copy background.html as background.html
  const backgroundSrc = resolve(outDir, 'src/background.html');
  const backgroundDest = resolve(outDir, 'background.html');

  if (existsSync(backgroundSrc)) {
    copyFileSync(backgroundSrc, backgroundDest);
  }

  // Copy files from source directory if they exist
  const srcDir = resolve(outDir, 'src');
  if (existsSync(srcDir)) {
    const files = readdirSync(srcDir);
    files.forEach((file: string) => {
      if (file.endsWith('.html')) {
        const srcFile = resolve(srcDir, file);
        const destFile = resolve(outDir, file);
        copyFileSync(srcFile, destFile);
      }
    });
  }

  // Check if background.bundle.js exists from the separate build
  const backgroundBundlePath = resolve(outDir, 'background.bundle.js');

  if (existsSync(backgroundBundlePath)) {
    logger.info('Background bundle already exists in target directory');
  } else {
    logger.warn('Background bundle not found in target directory');
  }

  // Ensure img directory exists and copy assets
  const imgSrc = resolve(outDir, 'src/assets/img');
  const imgDest = resolve(outDir, 'img');

  if (existsSync(imgSrc)) {
    mkdirSync(imgDest, { recursive: true });

    const files = readdirSync(imgSrc);
    files.forEach((file: string) => {
      const srcFile = resolve(imgSrc, file);
      const destFile = resolve(imgDest, file);
      copyFileSync(srcFile, destFile);
    });
  }

  // Copy manifest file LAST to ensure it's available only when everything is ready
  let manifestSrc: string;
  if (isDev) {
    manifestSrc = 'manifest.dev.json';
  } else {
    manifestSrc = targetBrowser === 'firefox' ? 'manifest.firefox.json' : 'manifest.chromium.json';
  }

  const manifestDest = resolve(outDir, 'manifest.json');
  logger.info({ manifestSrc, manifestDest }, 'Copying manifest');

  if (existsSync(manifestSrc)) {
    copyFileSync(manifestSrc, manifestDest);

    // For Firefox, convert service_worker to scripts format
    if (targetBrowser === 'firefox') {
      const manifestContent = JSON.parse(readFileSync(manifestDest, 'utf-8'));

      // Convert background.service_worker to background.scripts for Firefox
      if (manifestContent.background?.service_worker) {
        const serviceWorkerPath = manifestContent.background.service_worker;
        manifestContent.background = {
          scripts: [serviceWorkerPath],
        };
        logger.info('Converted background.service_worker to background.scripts for Firefox');
      }

      // Update CSP for Firefox if needed (add moz-extension: support)
      if (manifestContent.content_security_policy?.extension_pages) {
        let csp = manifestContent.content_security_policy.extension_pages;
        if (!csp.includes('moz-extension:')) {
          // Update img-src to include moz-extension:
          if (csp.includes("img-src 'self'")) {
            csp = csp.replace(/img-src 'self'([^;]*);/, (match: string, rest: string) => {
              if (!rest.includes('moz-extension:')) {
                return `img-src 'self'${rest} moz-extension:;`;
              }
              return match;
            });
          }

          // Update connect-src to include moz-extension: and preserve ws://localhost for dev
          if (csp.includes("connect-src 'self'")) {
            csp = csp.replace(/connect-src 'self'([^;]*);/, (match: string, rest: string) => {
              let updated = rest;
              if (!updated.includes('moz-extension:')) {
                updated += ' moz-extension:';
              }
              if (!updated.includes('data:')) {
                updated += ' data:';
              }
              if (!updated.includes('blob:')) {
                updated += ' blob:';
              }
              return `connect-src 'self'${updated};`;
            });
          }

          manifestContent.content_security_policy.extension_pages = csp;
          logger.info('Updated CSP for Firefox compatibility');
        }
      }

      // Add extension ID for production Firefox builds
      if (!isDev) {
        const extensionId = process.env.FIREFOX_EXTENSION_ID;
        if (extensionId) {
          if (!manifestContent.browser_specific_settings) {
            manifestContent.browser_specific_settings = {
              gecko: {
                id: extensionId,
              },
            };
            logger.info({ extensionId }, 'Added extension ID to Firefox manifest');
          }
        } else {
          logger.warn('FIREFOX_EXTENSION_ID environment variable not set');
        }
      }

      writeFileSync(manifestDest, JSON.stringify(manifestContent, null, 2), 'utf-8');
    }

    logger.info('Manifest copied successfully');
  } else {
    logger.warn({ manifestSrc }, 'Manifest source not found');
  }
};

const browserExtensionPlugin = (isDev: boolean = false): Plugin => ({
  name: 'browser-extension-build',
  writeBundle(options: { dir?: string }) {
    const targetBrowser = process.env.BROWSER || 'chrome';
    const outDir = options.dir || `build/${targetBrowser}`;

    logger.info({ outDir }, 'Browser extension plugin: copying files');
    copyBrowserExtensionFiles(targetBrowser, outDir, isDev);
  },
});

// eslint-disable-next-line import/no-default-export
export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';
  const targetBrowser = process.env.BROWSER || 'chrome';

  const plugins: PluginOption[] = [
    react({
      jsxRuntime: 'automatic',
    }),
    viteStaticCopy({
      targets: [
        {
          src: 'node_modules/@snack-uikit/icons/dist/esm/sprite/svg/sprite.symbol.svg',
          dest: '',
        },
      ],
    }),
    tsconfigPaths(),
  ];

  // Add auto-reload plugin only in dev mode
  if (!isProduction) {
    plugins.push(extensionReloadPlugin());
  }

  plugins.push(browserExtensionPlugin(!isProduction));

  return {
    plugins,
    base: './',
    define: {
      'process.env.NODE_ENV': JSON.stringify(mode),
      'process.env.BROWSER': JSON.stringify(targetBrowser),
    },
    build: {
      outDir: `build/${targetBrowser}`,
      emptyOutDir: false, // Не очищать папку при сборке, чтобы не удалять background.bundle.js
      sourcemap: !isProduction,
      chunkSizeWarningLimit: 1000,
      minify: isProduction ? 'terser' : false,

      terserOptions: isProduction
        ? {
            compress: {
              drop_console: true,
              drop_debugger: true,
            },
          }
        : undefined,
      rollupOptions: {
        input: {
          popup: resolve(__dirname, 'src/index.html'),
        },
        output: {
          entryFileNames: chunk => {
            if (chunk.name === 'popup') {
              return 'popup.bundle.js';
            }
            return '[name].bundle.js';
          },
          chunkFileNames: '[name].chunk.js',
          assetFileNames: assetInfo => {
            if (assetInfo.names?.some(name => name.includes('index.html'))) {
              return 'popup.html';
            }
            if (assetInfo.names?.some(name => name.endsWith('.css'))) {
              return 'styles.css';
            }
            return '[name].[ext]';
          },
          manualChunks: id => {
            // Для popup - создаем чанки
            if (id.includes('node_modules')) {
              return 'vendor';
            }
            return undefined;
          },
        },
        external: [],
      },
    },
    server: {
      port: targetBrowser === 'firefox' ? 3002 : 3001,
    },
    assetsInclude: ['**/*.otf', '**/*.ttf', '**/*.woff', '**/*.woff2'],
    publicDir: 'src/assets',
    copyPublicDir: true,
  };
});
