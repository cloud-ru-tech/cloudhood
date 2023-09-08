import { globSync } from 'glob';

export function getPackageJsonFilesPath() {
  return globSync(['package.json', '**/*/package.json'], {
    ignore: ['node_modules/**', '**/*/node_modules/**'],
  });
}
