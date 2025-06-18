import { copyFileSync, existsSync, mkdirSync } from 'fs';
import { resolve } from 'path';

import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin, type PluginOption } from 'vite';

const copyBrowserExtensionFiles = (targetBrowser: string, outDir: string): void => {
  // Ensure build directory exists
  mkdirSync(outDir, { recursive: true });

  // Copy manifest file
  const manifestSrc = targetBrowser === 'firefox' ? 'manifest.firefox.json' : 'manifest.chromium.json';
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
};

const browserExtensionPlugin = (): Plugin => ({
  name: 'browser-extension-build',
  writeBundle(options: { dir?: string }) {
    const targetBrowser = process.env.BROWSER || 'chrome';
    const outDir = options.dir || `build/${targetBrowser}`;

    copyBrowserExtensionFiles(targetBrowser, outDir);
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
  ];

  plugins.push(browserExtensionPlugin());

  return {
    plugins,
    base: './',
    define: {
      'process.env.NODE_ENV': JSON.stringify(mode),
      'process.env.BROWSER': JSON.stringify(targetBrowser),
    },
    resolve: {
      alias: {
        '#app': resolve(__dirname, 'src/app'),
        '#pages': resolve(__dirname, 'src/pages'),
        '#shared': resolve(__dirname, 'src/shared'),
        '#features': resolve(__dirname, 'src/features'),
        '#entities': resolve(__dirname, 'src/entities'),
        '#widgets': resolve(__dirname, 'src/widgets'),
      },
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
          background: resolve(__dirname, 'src/background.ts'),
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
          manualChunks: undefined, // Полностью отключаем разделение для диагностики
        },
      },
    },
    server: {
      port: targetBrowser === 'firefox' ? 3002 : 3001,
    },
    assetsInclude: ['**/*.otf', '**/*.ttf', '**/*.woff', '**/*.woff2'],
    publicDir: 'src/assets',
  };
});
