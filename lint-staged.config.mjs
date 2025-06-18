import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { defaultLintStagedConfig } = require('@cloud-ru/ft-config-lint-staged');

// eslint-disable-next-line import/no-default-export
export default defaultLintStagedConfig;
