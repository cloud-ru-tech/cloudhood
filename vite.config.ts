import { copyFileSync, existsSync, mkdirSync } from 'fs';
import { resolve } from 'path';

import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin, type PluginOption } from 'vite';

const devBuildPlugin = (targetBrowser: string): Plugin => ({
  name: 'dev-build-copy',
  writeBundle(options) {
    const copyToBuild = () => {
      const buildDir = options?.dir || resolve(`build/${targetBrowser}`);

      mkdirSync(buildDir, { recursive: true });

      const manifestSrc = targetBrowser === 'firefox' ? 'manifest.firefox.json' : 'manifest.chromium.json';

      if (existsSync(manifestSrc)) {
        copyFileSync(manifestSrc, resolve(buildDir, 'manifest.json'));
      }

      const indexSrc = resolve(buildDir, 'src/index.html');
      const popupDest = resolve(buildDir, 'popup.html');

      if (existsSync(indexSrc)) {
        copyFileSync(indexSrc, popupDest);
      }
    };

    copyToBuild();
  },
});

const copyManifestPlugin = (): Plugin => ({
  name: 'copy-manifest',
  writeBundle(options: { dir?: string }) {
    const targetBrowser = process.env.BROWSER || 'chrome';
    const manifestSrc = targetBrowser === 'firefox' ? 'manifest.firefox.json' : 'manifest.chromium.json';

    const outDir = options.dir || `build/${targetBrowser}`;
    const manifestDest = resolve(outDir, 'manifest.json');

    if (existsSync(manifestSrc)) {
      copyFileSync(manifestSrc, manifestDest);
    }

    const indexSrc = resolve(outDir, 'src/index.html');
    const popupDest = resolve(outDir, 'popup.html');

    if (existsSync(indexSrc)) {
      copyFileSync(indexSrc, popupDest);
    }
  },
});

// eslint-disable-next-line import/no-default-export
export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';
  const isDevelopment = mode === 'development';
  const targetBrowser = process.env.BROWSER || 'chrome';

  const plugins: PluginOption[] = [
    react({
      jsxImportSource: '@emotion/react',
    }),
  ];

  if (isDevelopment) {
    plugins.push(devBuildPlugin(targetBrowser));
  } else {
    plugins.push(copyManifestPlugin());
  }

  return {
    plugins,
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
          manualChunks: isDevelopment
            ? undefined
            : id => {
                if (id.includes('react') || id.includes('react-dom')) {
                  return 'vendor-react';
                }

                if (id.includes('@snack-uikit')) {
                  return 'snack-ui';
                }

                if (id.includes('@emotion')) {
                  return 'emotion';
                }

                if (id.includes('effector')) {
                  return 'effector';
                }

                if (id.includes('@dnd-kit')) {
                  return 'dnd';
                }

                if (id.includes('/features/')) {
                  return 'features';
                }

                if (id.includes('/widgets/')) {
                  return 'widgets';
                }

                if (id.includes('/entities/')) {
                  return 'entities';
                }

                if (id.includes('node_modules')) {
                  return 'vendor';
                }
              },
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
