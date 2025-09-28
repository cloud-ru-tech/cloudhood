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
    sourcemap: true, // Включаем sourcemap для разработки
    minify: false, // Отключаем минификацию для разработки
    rollupOptions: {
      input: resolve(__dirname, 'src/background.ts'),
      output: {
        entryFileNames: 'background.bundle.js',
        format: 'iife', // Используем IIFE формат для background script
        inlineDynamicImports: true, // Встраиваем все динамические импорты
      },
      external: [],
    },
    emptyOutDir: false, // Не очищать папку при сборке
  },
  assetsInclude: ['**/*.otf', '**/*.ttf', '**/*.woff', '**/*.woff2'],
});
