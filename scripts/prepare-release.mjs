import { execFileSync } from 'node:child_process';
import { appendFileSync, readFileSync, writeFileSync } from 'node:fs';

const jsonFiles = ['package.json', 'manifest.chromium.json', 'manifest.firefox.json'];

function git(...args) {
  return execFileSync('git', args, { encoding: 'utf8' }).trim();
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function writeJson(path, value) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

function getLatestTag() {
  try {
    return git('describe', '--tags', '--abbrev=0', '--match', 'v[0-9]*');
  } catch {
    throw new Error('No release tag found. Create an initial v<major>.<minor>.<patch> tag first.');
  }
}

function parseVersion(tag) {
  const match = /^v(\d+)\.(\d+)\.(\d+)$/.exec(tag);

  if (!match) {
    throw new Error(`Latest release tag "${tag}" is not a valid v<major>.<minor>.<patch> tag.`);
  }

  return match.slice(1).map(Number);
}

function getCommits(previousTag) {
  const log = git(
    'log',
    '--format=%H%x1f%h%x1f%s%x1f%b%x1e',
    `${previousTag}..HEAD`,
  );

  return log
    .split('\x1e')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [sha, shortSha, subject, body = ''] = entry.split('\x1f');
      return { sha, shortSha, subject, body };
    })
    .filter(({ subject }) => !/^ci: bump version to \d+\.\d+\.\d+ \[skip ci\]$/.test(subject));
}

function getBumpType(commits) {
  if (commits.some(({ subject, body }) => /^[a-z]+(?:\([^)]+\))?!:/i.test(subject) || /BREAKING[ -]CHANGE:/i.test(body))) {
    return 'major';
  }

  if (commits.some(({ subject }) => /^feat(?:\([^)]+\))?:/i.test(subject))) {
    return 'minor';
  }

  return 'patch';
}

function bumpVersion([major, minor, patch], bumpType) {
  if (bumpType === 'major') {
    return `${major + 1}.0.0`;
  }

  if (bumpType === 'minor') {
    return `${major}.${minor + 1}.0`;
  }

  return `${major}.${minor}.${patch + 1}`;
}

function escapeMarkdown(value) {
  return value.replace(/([\\[\]])/g, '\\$1');
}

function buildReleaseNotes(previousTag, version, commits) {
  const repository = process.env.GITHUB_REPOSITORY;
  const serverUrl = process.env.GITHUB_SERVER_URL ?? 'https://github.com';
  const compareLink = repository
    ? `\n\n**Full changelog:** [${previousTag}...v${version}](${serverUrl}/${repository}/compare/${previousTag}...v${version})`
    : '';
  const changes = commits
    .map(({ sha, shortSha, subject }) => {
      const commit = repository ? `[\`${shortSha}\`](${serverUrl}/${repository}/commit/${sha})` : `\`${shortSha}\``;
      return `- ${commit} ${escapeMarkdown(subject)}`;
    })
    .join('\n');

  return `## Changes\n\n${changes}${compareLink}\n`;
}

const previousTag = getLatestTag();
const commits = getCommits(previousTag);

if (commits.length === 0) {
  throw new Error(`No commits found after ${previousTag}.`);
}

const bumpType = getBumpType(commits);
const version = bumpVersion(parseVersion(previousTag), bumpType);
const tag = `v${version}`;

for (const path of jsonFiles) {
  const json = readJson(path);
  json.version = version;
  writeJson(path, json);
}

const notesFile = 'release-notes.md';
writeFileSync(notesFile, buildReleaseNotes(previousTag, version, commits));

if (process.env.GITHUB_OUTPUT) {
  appendFileSync(
    process.env.GITHUB_OUTPUT,
    `previous_tag=${previousTag}\nversion=${version}\ntag=${tag}\nbump_type=${bumpType}\nnotes_file=${notesFile}\n`,
  );
}

process.stdout.write(`Prepared ${tag} (${bumpType}) from ${commits.length} commit(s) after ${previousTag}.\n`);
