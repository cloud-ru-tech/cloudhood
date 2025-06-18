import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { defaultLintStagedConfig } = require('@cloud-ru/ft-config-lint-staged');

export default defaultLintStagedConfig;
