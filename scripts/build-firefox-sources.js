/* eslint-disable no-console */
const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Создает zip архив с исходниками для Firefox Add-ons
 * Mozilla требует предоставления исходного кода для расширений
 */
async function buildFirefoxSources() {
  const rootDir = path.resolve(__dirname, '..');
  const sourcesDir = path.join(rootDir, 'firefox-sources');
  const zipName = 'cloudhood-firefox-sources.zip';

  console.log('🔧 Создание архива с исходниками Firefox расширения...');

  try {
    if (await fs.pathExists(sourcesDir)) {
      await fs.remove(sourcesDir);
    }

    await fs.ensureDir(sourcesDir);

    const filesToInclude = [
      'src/',
      'scripts/',

      'package.json',
      'package-lock.json',
      'tsconfig.json',
      'webpack.config.js',
      'vitest.config.ts',

      '.eslintrc.js',
      '.prettierrc',
      'stylelint.config.js',
      'lint-staged.config.js',

      'manifest.firefox.json',
      'manifest.chromium.json',

      'README.md',
      'LICENSE',
      'RELEASE_SETUP.md',

      '.npmrc',
    ];

    for (const item of filesToInclude) {
      const sourcePath = path.join(rootDir, item);
      const targetPath = path.join(sourcesDir, item);

      if (await fs.pathExists(sourcePath)) {
        const stat = await fs.stat(sourcePath);
        if (stat.isDirectory()) {
          await fs.copy(sourcePath, targetPath, {
            filter: src => {
              const relativePath = path.relative(rootDir, src);
              return (
                !relativePath.includes('node_modules') &&
                !relativePath.includes('build/') &&
                !relativePath.includes('.git/') &&
                !relativePath.includes('reports/unit/') &&
                !relativePath.endsWith('.zip') &&
                !relativePath.includes('.DS_Store') &&
                !relativePath.includes('.vscode') &&
                !relativePath.includes('.idea')
              );
            },
          });
        } else {
          await fs.copy(sourcePath, targetPath);
        }
        console.log(`✅ Скопировано: ${item}`);
      } else {
        console.log(`⚠️  Файл не найден: ${item}`);
      }
    }

    const buildInstructions = `# Cloudhood Firefox Extension - Source Code

This archive contains the source code of the Cloudhood extension for Firefox.

## Build Instructions

1. Install Node.js (version 16 or higher)
2. Install dependencies:
   \`\`\`bash
   npm ci
   \`\`\`

3. Build the Firefox extension:
   \`\`\`bash
   npm run build:firefox
   \`\`\`

4. The built extension will be located in the \`build/firefox/\` folder

## Project Structure

- \`src/\` - extension source code
- \`scripts/\` - build scripts
- \`manifest.firefox.json\` - Firefox manifest
- \`webpack.config.js\` - Webpack configuration
- \`package.json\` - dependencies and scripts

## License

Apache-2.0 - see LICENSE file

## Author

Cloud technology Limited (Ltd.)
https://cloud.ru/
`;

    await fs.writeFile(path.join(sourcesDir, 'BUILD_INSTRUCTIONS.md'), buildInstructions);
    console.log('✅ Создан файл BUILD_INSTRUCTIONS.md');

    console.log('📦 Создание zip архива...');

    process.chdir(sourcesDir);
    execSync(`zip -r ../${zipName} .`, { stdio: 'inherit' });

    process.chdir(rootDir);

    await fs.remove(sourcesDir);

    const zipPath = path.join(rootDir, zipName);
    const stats = await fs.stat(zipPath);
    const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);

    console.log(`✅ Архив с исходниками создан: ${zipName}`);
    console.log(`📊 Размер архива: ${fileSizeInMB} MB`);
    console.log(`📍 Путь: ${zipPath}`);

    return zipPath;
  } catch (error) {
    console.error('❌ Ошибка при создании архива с исходниками:', error);

    if (await fs.pathExists(sourcesDir)) {
      await fs.remove(sourcesDir);
    }

    throw error;
  }
}

if (require.main === module) {
  buildFirefoxSources()
    .then(() => {
      console.log('🎉 Готово!');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Ошибка:', error);
      process.exit(1);
    });
}

module.exports = { buildFirefoxSources };
