import effectorPlugin from 'eslint-plugin-effector';

import cloudConfig from '@cloud-ru/eslint-config';

export default [
  {
    ignores: ['scripts/**/*', 'playwright.config.ts', 'stylelint.config.cjs'],
  },
  ...cloudConfig,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  effectorPlugin.flatConfigs.recommended,
  effectorPlugin.flatConfigs.scope,
  effectorPlugin.flatConfigs.react,
  {
    rules: {
      '@typescript-eslint/no-namespace': 'off',
      'prettier/prettier': 'off',
    },
  },
];
