const config = require('@cloud-ru/ft-config-stylelint');

module.exports = {
  ...config,
  overrides: [
    {
      files: ['**/*.css'],
    },
    {
      files: ['**/*.ts', '**/*.tsx'],
      customSyntax: 'postcss-styled-syntax',
    },
  ],
};

