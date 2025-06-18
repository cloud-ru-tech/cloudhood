import { execSync } from 'child_process';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

// Файлы и папки для исключения из исходников
const EXCLUDE_PATTERNS = [
  'node_modules',
  'dist',
  'build',
  'firefox-sources',
  '.git',
  '.github',
  'coverage',
  'reports',
  '*.log',
  '.DS_Store',
  'Thumbs.db',
  '.vscode',
  '.idea',
  '*.zip',
  '*.tar.gz',
  '.env',
  '.env.local',
  '.env.production',
  '.env.development',
];

// Конкретные файлы для включения в корне проекта
const INCLUDE_FILES = [
  'package.json',
  'package-lock.json',
  'README.md',
  'LICENSE',
  'CODEOWNERS',
  'RELEASE_SETUP.md',
  'tsconfig.json',
  'webpack.config.js',
  'lint-staged.config.js',
  'stylelint.config.js',
  'vitest.config.ts',
  'manifest.chromium.json',
  'manifest.firefox.json',
];

// Папки для включения
const INCLUDE_DIRECTORIES = ['src', 'scripts'];

function shouldExclude(filePath, relativePath) {
  return EXCLUDE_PATTERNS.some(pattern => {
    if (pattern.includes('*')) {
      return relativePath.includes(pattern.replace(/\*/g, ''));
    }
    return relativePath.includes(pattern);
  });
}

async function createBuildInstructions() {
  console.log('📝 Создаем инструкции по сборке...');

  const instructions = `# Инструкции по сборке CloudHood для Firefox

## Системные требования

- Node.js версии 18 или выше
- pnpm версии 10.10.0 или выше

## Установка зависимостей

\`\`\`bash
pnpm install
\`\`\`

## Сборка расширения

Для сборки расширения для Firefox выполните:

\`\`\`bash
pnpm build:firefox
\`\`\`

Собранное расширение будет находиться в папке \`build/firefox/\`.

## Дополнительные команды

- \`pnpm lint\` - проверка кода на соответствие стандартам
- \`pnpm test:unit\` - запуск юнит-тестов
- \`pnpm start:firefox\` - запуск в режиме разработки для Firefox
- \`pnpm build:chromium\` - сборка для Chromium/Chrome

## Структура проекта

- \`src/\` - исходный код расширения
- \`scripts/\` - скрипты сборки
- \`manifest.firefox.json\` - манифест для Firefox
- \`manifest.chromium.json\` - манифест для Chromium
- \`webpack.config.js\` - конфигурация Webpack
- \`tsconfig.json\` - конфигурация TypeScript

## Файлы конфигурации

- \`lint-staged.config.js\` - конфигурация pre-commit хуков
- \`stylelint.config.js\` - конфигурация StyleLint
- \`vitest.config.ts\` - конфигурация тестов

## Примечания

Данный архив содержит полные исходные коды расширения CloudHood.
Все зависимости указаны в package.json и устанавливаются автоматически при выполнении \`pnpm install\`.

Расширение поддерживает как Firefox, так и Chromium-браузеры.
Используются отдельные манифесты для каждого типа браузера.
`;

  await fs.writeFile(path.join(PROJECT_ROOT, 'BUILD_INSTRUCTIONS.md'), instructions);
  console.log('✓ BUILD_INSTRUCTIONS.md');
}

async function createSourcesArchive() {
  console.log('📦 Создаем архив с исходниками...');

  const archiveName = `cloudhood-firefox-sources.zip`;
  const archivePath = path.join(PROJECT_ROOT, archiveName);

  try {
    // Удаляем старый архив если есть
    if (await fs.pathExists(archivePath)) {
      await fs.remove(archivePath);
    }

    // Создаем список файлов для архива
    const filesToArchive = [];

    // Добавляем основные файлы
    for (const file of INCLUDE_FILES) {
      const filePath = path.join(PROJECT_ROOT, file);
      if (await fs.pathExists(filePath)) {
        filesToArchive.push(file);
      }
    }

    // Добавляем папки
    for (const dir of INCLUDE_DIRECTORIES) {
      const dirPath = path.join(PROJECT_ROOT, dir);
      if (await fs.pathExists(dirPath)) {
        filesToArchive.push(dir);
      }
    }

    // Добавляем конфигурационные файлы
    const rootFiles = await fs.readdir(PROJECT_ROOT);
    for (const file of rootFiles) {
      const filePath = path.join(PROJECT_ROOT, file);
      const stats = await fs.stat(filePath);

      if (stats.isFile() && !INCLUDE_FILES.includes(file)) {
        if (
          file.includes('.config.') ||
          file.startsWith('.') ||
          file.endsWith('.json') ||
          file.endsWith('.js') ||
          file.endsWith('.ts') ||
          file.endsWith('.md')
        ) {
          if (!shouldExclude(filePath, file)) {
            filesToArchive.push(file);
          }
        }
      }
    }

    // Добавляем BUILD_INSTRUCTIONS.md
    filesToArchive.push('BUILD_INSTRUCTIONS.md');

    // Создаем zip архив
    const filesList = filesToArchive.join(' ');
    execSync(`cd "${PROJECT_ROOT}" && zip -r "${archiveName}" ${filesList}`, {
      stdio: 'inherit',
    });

    console.log(`✓ Архив создан: ${archiveName}`);
    console.log(`📍 Путь: ${archivePath}`);

    // Показываем размер архива
    const stats = await fs.stat(archivePath);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`📊 Размер архива: ${sizeMB} MB`);
  } catch (error) {
    console.error('❌ Ошибка при создании архива:', error.message);
    process.exit(1);
  }
}

async function validateSources() {
  console.log('🔍 Проверяем файлы проекта...');

  const requiredFiles = ['package.json', 'src', 'scripts', 'manifest.firefox.json'];

  for (const file of requiredFiles) {
    const filePath = path.join(PROJECT_ROOT, file);
    if (!(await fs.pathExists(filePath))) {
      console.error(`❌ Отсутствует обязательный файл: ${file}`);
      process.exit(1);
    }
  }

  console.log('✓ Все обязательные файлы присутствуют');
}

async function main() {
  try {
    console.log('🚀 Начинаем сборку архива исходников для Firefox Store...\n');

    await createBuildInstructions();
    console.log('');

    await validateSources();
    console.log('');

    await createSourcesArchive();
    console.log('');

    // Удаляем BUILD_INSTRUCTIONS.md после создания архива
    await fs.remove(path.join(PROJECT_ROOT, 'BUILD_INSTRUCTIONS.md'));

    console.log('✅ Сборка архива исходников завершена успешно!');
    console.log('🔍 Архив готов для отправки в Firefox Store');
  } catch (error) {
    console.error('❌ Ошибка при сборке исходников:', error);
    process.exit(1);
  }
}

main();
main();
