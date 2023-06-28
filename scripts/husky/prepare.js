const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

execSync(`cd ${process.env.INIT_CWD} && husky install`);

!fs.existsSync(path.resolve(process.env.INIT_CWD, '.husky/pre-commit')) &&
  execSync(`cd ${process.env.INIT_CWD} && husky set .husky/pre-commit node_modules/.bin/lint-staged`);

!fs.existsSync(path.resolve(process.env.INIT_CWD, '.husky/pre-push')) &&
  execSync(`cd ${process.env.INIT_CWD} && husky set .husky/pre-push node_modules/.bin/solidarity`);

!fs.existsSync(path.resolve(process.env.INIT_CWD, '.husky/commit-msg')) &&
  execSync(`cd ${process.env.INIT_CWD} && husky set .husky/commit-msg node_modules/.bin/sbercloud-commit-message`);

execSync(`cp -f ${path.resolve(__dirname, '.solidarity')} ${path.resolve(process.env.INIT_CWD, '.solidarity')}`);
