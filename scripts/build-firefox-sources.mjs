import { execSync } from 'child_process';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

// Files and folders to exclude from sources
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
  'tests',
];

// Specific files to include at the project root
const INCLUDE_FILES = [
  'package.json',
  'package-lock.json',
  'README.md',
  'LICENSE',
  'CODEOWNERS',
  'RELEASE_SETUP.md',
  'tsconfig.json',
  'webpack.config.js',
  'lint-staged.config.mjs',
  'stylelint.config.cjs',
  'vitest.config.ts',
  'manifest.chromium.json',
  'manifest.firefox.json',
];

// Directories to include
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
  console.log('📝 Creating build instructions...');

  const instructions = `# CloudHood Firefox Build Instructions

## System Requirements

- Node.js 18 or higher
- pnpm 10.10.0 or higher

## Install Dependencies

\`\`\`bash
pnpm install
\`\`\`

## Build the Extension

To build the Firefox extension, run:

\`\`\`bash
pnpm build:firefox
\`\`\`

The built extension will be located in \`build/firefox/\`.

## Additional Commands

- \`pnpm lint\` - lint the codebase
- \`pnpm test:unit\` - run unit tests
- \`pnpm start:firefox\` - start Firefox development mode
- \`pnpm build:chromium\` - build for Chromium/Chrome

## Project Structure

- \`src/\` - extension source code
- \`scripts/\` - build scripts
- \`manifest.firefox.json\` - Firefox manifest
- \`manifest.chromium.json\` - Chromium manifest
- \`webpack.config.js\` - Webpack configuration
- \`tsconfig.json\` - TypeScript configuration

## Configuration Files

- \`lint-staged.config.mjs\` - pre-commit hooks configuration
- \`stylelint.config.cjs\` - StyleLint configuration
- \`vitest.config.ts\` - test configuration

## Notes

This archive contains the full CloudHood extension source code.
All dependencies are listed in package.json and installed automatically when running \`pnpm install\`.

The extension supports both Firefox and Chromium browsers.
Separate manifests are used for each browser type.
`;

  await fs.writeFile(path.join(PROJECT_ROOT, 'BUILD_INSTRUCTIONS.md'), instructions);
  console.log('✓ BUILD_INSTRUCTIONS.md');
}

async function createSourcesArchive() {
  console.log('📦 Creating source archive...');

  const archiveName = `cloudhood-firefox-sources.zip`;
  const archivePath = path.join(PROJECT_ROOT, archiveName);

  try {
    // Remove the old archive if it exists
    if (await fs.pathExists(archivePath)) {
      await fs.remove(archivePath);
    }

    // Build the list of files to archive
    const filesToArchive = [];

    // Add primary files
    for (const file of INCLUDE_FILES) {
      const filePath = path.join(PROJECT_ROOT, file);
      if (await fs.pathExists(filePath)) {
        filesToArchive.push(file);
      }
    }

    // Add directories
    for (const dir of INCLUDE_DIRECTORIES) {
      const dirPath = path.join(PROJECT_ROOT, dir);
      if (await fs.pathExists(dirPath)) {
        filesToArchive.push(dir);
      }
    }

    // Add configuration files
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

    // Add BUILD_INSTRUCTIONS.md
    filesToArchive.push('BUILD_INSTRUCTIONS.md');

    // Create the zip archive
    const filesList = filesToArchive.join(' ');
    execSync(`cd "${PROJECT_ROOT}" && zip -r "${archiveName}" ${filesList}`, {
      stdio: 'inherit',
    });

    console.log(`✓ Archive created: ${archiveName}`);
    console.log(`📍 Path: ${archivePath}`);

    // Show archive size
    const stats = await fs.stat(archivePath);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`📊 Archive size: ${sizeMB} MB`);
  } catch (error) {
    console.error('❌ Error creating archive:', error.message);
    process.exit(1);
  }
}

async function validateSources() {
  console.log('🔍 Checking project files...');

  const requiredFiles = ['package.json', 'src', 'scripts', 'manifest.firefox.json'];

  for (const file of requiredFiles) {
    const filePath = path.join(PROJECT_ROOT, file);
    if (!(await fs.pathExists(filePath))) {
      console.error(`❌ Missing required file: ${file}`);
      process.exit(1);
    }
  }

  console.log('✓ All required files are present');
}

async function main() {
  try {
    console.log('🚀 Starting source archive build for Firefox Store...\n');

    await createBuildInstructions();
    console.log('');

    await validateSources();
    console.log('');

    await createSourcesArchive();
    console.log('');

    // Remove BUILD_INSTRUCTIONS.md after creating the archive
    await fs.remove(path.join(PROJECT_ROOT, 'BUILD_INSTRUCTIONS.md'));

    console.log('✅ Source archive build completed successfully!');
    console.log('🔍 The archive is ready for submission to Firefox Store');
  } catch (error) {
    console.error('❌ Error building sources:', error);
    process.exit(1);
  }
}

main();
main();
