import { copyFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { resolve } from 'path';

import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin, type PluginOption } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

import { extensionReloadPlugin } from './src/utils/extension-reload-plugin';

const copyBrowserExtensionFiles = (targetBrowser: string, outDir: string, isDev: boolean = false): void => {
  // Ensure build directory exists
  mkdirSync(outDir, { recursive: true });

  // Copy manifest file
  let manifestSrc: string;
  if (isDev) {
    manifestSrc = 'manifest.dev.json';
  } else {
    manifestSrc = targetBrowser === 'firefox' ? 'manifest.firefox.json' : 'manifest.chromium.json';
  }

  const manifestDest = resolve(outDir, 'manifest.json');

  if (existsSync(manifestSrc)) {
    copyFileSync(manifestSrc, manifestDest);
  }

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
};

const browserExtensionPlugin = (isDev: boolean = false): Plugin => ({
  name: 'browser-extension-build',
  writeBundle(options: { dir?: string }) {
    const targetBrowser = process.env.BROWSER || 'chrome';
    const outDir = options.dir || `build/${targetBrowser}`;

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
    tsconfigPaths(),
  ];

  // Добавляем плагин автоперезагрузки только в dev mode
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
          background: resolve(__dirname, 'src/background.html'),
        },
        output: {
          entryFileNames: chunk => {
            if (chunk.name === 'popup') {
              return 'popup.bundle.js';
            }
            if (chunk.name === 'background') {
              return 'background.bundle.js';
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
            // Для background script - создаем отдельный бандл без чанков
            if (id.includes('background')) {
              return 'background';
            }
            // Для popup - создаем чанки
            if (id.includes('node_modules') && !id.includes('background')) {
              return 'vendor';
            }
            return undefined;
          },
          inlineDynamicImports: false,
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
