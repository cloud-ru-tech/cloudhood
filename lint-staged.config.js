module.exports = {
  '*.{ts,js,tsx,jsx}': ['eslint --fix', 'prettier --write', 'stylelint'],
  '*.scss': ['stylelint --fix'],
};
