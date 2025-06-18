import { resolve } from 'path';

import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [
    react({
      jsxImportSource: '@emotion/react',
    }),
    svgr({
      include: '**/*.svg',
      exclude: '**/*.symbol.svg',
    }),
  ],
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
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    exclude: ['**/tests/**', '**/node_modules/**'],
  },
});
