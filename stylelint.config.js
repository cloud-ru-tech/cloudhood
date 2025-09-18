import config from '@cloud-ru/ft-config-stylelint';

// eslint-disable-next-line import/no-default-export
export default {
  ...config,
  overrides: [
    {
      files: ['**/*.css'],
      customSyntax: 'postcss',
    },
    {
      files: ['**/*.ts', '**/*.tsx'],
      customSyntax: 'postcss-styled-syntax',
    },
  ],
};
