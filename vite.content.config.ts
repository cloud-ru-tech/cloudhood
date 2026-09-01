import { resolve } from 'path';

import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

const contentEntries = {
  main: {
    input: resolve(__dirname, 'src/content-scripts/response-overrides-main.ts'),
    fileName: 'response-overrides-main.bundle.js',
  },
  bridge: {
    input: resolve(__dirname, 'src/content-scripts/response-overrides-bridge.ts'),
    fileName: 'response-overrides-bridge.bundle.js',
  },
} as const;

const requestedEntry = process.env.CONTENT_ENTRY;
const selectedEntry = requestedEntry === 'bridge' ? contentEntries.bridge : contentEntries.main;

// eslint-disable-next-line import/no-default-export
export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';

  return {
    plugins: [tsconfigPaths()],
    base: './',
    define: {
      'process.env.NODE_ENV': JSON.stringify(mode),
      'process.env.BROWSER': JSON.stringify(process.env.BROWSER || 'chrome'),
    },
    build: {
      outDir: `build/${process.env.BROWSER || 'chrome'}`,
      sourcemap: !isProduction,
      minify: false,
      rollupOptions: {
        input: selectedEntry.input,
        output: {
          entryFileNames: selectedEntry.fileName,
          format: 'iife',
          inlineDynamicImports: true,
        },
        external: [],
      },
      emptyOutDir: false,
    },
  };
});
