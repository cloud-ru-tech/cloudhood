import { fixupPluginRules } from '@eslint/compat';
import { FlatCompat } from '@eslint/eslintrc';
import effectorPlugin from 'eslint-plugin-effector';

import cloudConfig from '@cloud-ru/eslint-config';

const compat = new FlatCompat();

export default [
  {
    ignores: ['scripts/**/*'],
  },
  ...cloudConfig,
  ...compat.extends('plugin:effector/recommended'),
  {
    plugins: {
      effector: fixupPluginRules(effectorPlugin),
    },
    rules: {
      //effector
      ...effectorPlugin.configs.recommended.rules,
      ...effectorPlugin.configs.scope.rules,
      ...effectorPlugin.configs.react.rules,
      // Possible Errors
      '@typescript-eslint/no-namespace': 'off',
      'prettier/prettier': 'off',
    },
  },
];

