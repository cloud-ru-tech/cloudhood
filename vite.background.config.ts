import { resolve } from 'path';

import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

// eslint-disable-next-line import/no-default-export
export default defineConfig({
  plugins: [tsconfigPaths()],
  base: './',
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
    'process.env.BROWSER': JSON.stringify(process.env.BROWSER || 'chrome'),
  },
  build: {
    outDir: `build/${process.env.BROWSER || 'chrome'}`,
    sourcemap: true, // Enable sourcemaps for development
    minify: false, // Disable minification for development
    rollupOptions: {
      input: resolve(__dirname, 'src/background.ts'),
      output: {
        entryFileNames: 'background.bundle.js',
        format: 'iife', // Use IIFE format for the background script
        inlineDynamicImports: true, // Inline all dynamic imports
      },
      external: [],
    },
    emptyOutDir: false, // Do not clear the folder during build
  },
  assetsInclude: ['**/*.otf', '**/*.ttf', '**/*.woff', '**/*.woff2'],
});
