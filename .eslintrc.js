module.exports = {
  extends: ['@cloud-ru/eslint-config/base', 'plugin:effector/recommended'],
  rules: {
    '@typescript-eslint/no-namespace': 'off',
    'prettier/prettier': 'off',
  },
  plugins: ['effector'],
};
