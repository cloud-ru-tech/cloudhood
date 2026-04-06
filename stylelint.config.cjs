const imported = require('@cloud-ru/ft-config-stylelint');
const config = imported.default ?? imported;

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

