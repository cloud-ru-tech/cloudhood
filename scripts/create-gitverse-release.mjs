import { readFileSync } from 'node:fs';
import { basename } from 'node:path';

const { GITVERSE_TOKEN, GITVERSE_REPOSITORY, GITVERSE_API_URL, GITHUB_REPOSITORY, RELEASE_TAG } = process.env;

const repository = GITVERSE_REPOSITORY || GITHUB_REPOSITORY;
const releaseNotesPath = process.env.RELEASE_NOTES_PATH || 'release-notes.md';
const assetPaths = process.argv.slice(2);

if (!GITVERSE_TOKEN) {
  throw new Error('GITVERSE_TOKEN is required.');
}

if (!repository) {
  throw new Error('GITVERSE_REPOSITORY or GITHUB_REPOSITORY is required.');
}

if (!RELEASE_TAG) {
  throw new Error('RELEASE_TAG is required.');
}

if (assetPaths.length === 0) {
  throw new Error('At least one release asset path is required.');
}

const apiUrl = (GITVERSE_API_URL || 'https://api.gitverse.ru').replace(/\/$/, '');
const headers = {
  Authorization: `Bearer ${GITVERSE_TOKEN}`,
  Accept: 'application/vnd.gitverse.object+json;version=1',
};

async function request(path, options = {}) {
  const response = await fetch(`${apiUrl}${path}`, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`GitVerse API request failed: ${response.status} ${response.statusText}\n${text}`);
  }

  return text ? JSON.parse(text) : null;
}

const body = readFileSync(releaseNotesPath, 'utf8');

const release = await request(`/repos/${repository}/releases`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    tag_name: RELEASE_TAG,
    name: `Release ${RELEASE_TAG}`,
    target_commitish: process.env.GITHUB_SHA,
    body,
    draft: false,
    prerelease: false,
    is_authorized_only: false,
  }),
});

for (const assetPath of assetPaths) {
  const fileName = basename(assetPath);
  const form = new FormData();
  form.append('attachment', new Blob([readFileSync(assetPath)]), fileName);

  await request(`/repos/${repository}/releases/${release.id}/assets?name=${encodeURIComponent(fileName)}`, {
    method: 'POST',
    body: form,
  });
}

process.stdout.write(`Created GitVerse release ${RELEASE_TAG} with ${assetPaths.length} asset(s).\n`);
