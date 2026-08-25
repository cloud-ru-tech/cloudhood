import { readFileSync, writeFileSync } from 'node:fs';

const manifestFiles = ['manifest.chromium.json', 'manifest.firefox.json'];
const { version } = JSON.parse(readFileSync('package.json', 'utf8'));

if (!/^\d+\.\d+\.\d+$/.test(version)) {
  throw new Error(`Extension version "${version}" must use the <major>.<minor>.<patch> format.`);
}

for (const file of manifestFiles) {
  const manifest = JSON.parse(readFileSync(file, 'utf8'));
  manifest.version = version;
  writeFileSync(file, `${JSON.stringify(manifest, null, 2)}\n`);
}

process.stdout.write(`Synchronized extension manifests to v${version}.\n`);
