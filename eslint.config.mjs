import effectorPlugin from 'eslint-plugin-effector';

import cloudConfig from '@cloud-ru/eslint-config';

export default [
  {
    ignores: ['scripts/**/*', 'playwright.config.ts', 'stylelint.config.cjs', 'tests/e2e/**/*'],
  },
  ...cloudConfig,
  {
    files: ['**/*.ts', '**/*.tsx'],
    plugins: {
      effector: effectorPlugin,
    },
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      ...effectorPlugin.configs.recommended.rules,
      ...effectorPlugin.configs.scope.rules,
      ...effectorPlugin.configs.react.rules,
      '@typescript-eslint/no-namespace': 'off',
      'prettier/prettier': 'off',
    },
  },
];
