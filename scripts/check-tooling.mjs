import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

function parseVersion(v) {
  const m = String(v).trim().match(/^v?(\d+)\.(\d+)\.(\d+)/);
  if (!m) return null;
  return { major: Number(m[1]), minor: Number(m[2]), patch: Number(m[3]) };
}

function cmp(a, b) {
  if (a.major !== b.major) return a.major - b.major;
  if (a.minor !== b.minor) return a.minor - b.minor;
  return a.patch - b.patch;
}

function satisfies(version, range) {
  const r = String(range).trim();
  if (r.startsWith('>=')) {
    const min = parseVersion(r.slice(2));
    return min ? cmp(version, min) >= 0 : false;
  }
  if (r.startsWith('^')) {
    const base = parseVersion(r.slice(1));
    if (!base) return false;
    const upper = { major: base.major + 1, minor: 0, patch: 0 };
    return cmp(version, base) >= 0 && cmp(version, upper) < 0;
  }
  const exact = parseVersion(r);
  return exact ? cmp(version, exact) === 0 : false;
}

function getCmdVersion(cmd) {
  return execSync(cmd, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
}

const repoRoot = path.resolve(process.cwd());
const pkg = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));

const errors = [];

// Node version
const nodeWanted = pkg?.engines?.node;
if (nodeWanted) {
  const nodeInstalled = parseVersion(process.version);
  if (!nodeInstalled || !satisfies(nodeInstalled, nodeWanted)) {
    errors.push(
      `Node version mismatch: installed ${process.version}, wanted ${nodeWanted}.`
    );
  }
}

// pnpm version (prefer packageManager pin)
const pm = String(pkg?.packageManager ?? '');
const pmMatch = pm.match(/^(pnpm)@(\d+\.\d+\.\d+)$/);
const pnpmWanted = pmMatch?.[2] ?? pkg?.engines?.pnpm;
if (pnpmWanted) {
  let pnpmInstalledRaw = null;
  try {
    pnpmInstalledRaw = getCmdVersion('pnpm -v');
  } catch {
    // Try corepack-provided pnpm
    try {
      pnpmInstalledRaw = getCmdVersion('corepack pnpm -v');
    } catch {
      pnpmInstalledRaw = null;
    }
  }

  const pnpmInstalled = pnpmInstalledRaw ? parseVersion(pnpmInstalledRaw) : null;
  const pnpmWantedForCheck = pmMatch ? pnpmWanted : String(pnpmWanted);

  if (!pnpmInstalled || !satisfies(pnpmInstalled, pnpmWantedForCheck)) {
    errors.push(
      `pnpm version mismatch: installed ${pnpmInstalledRaw ?? 'missing'}, wanted ${pnpmWantedForCheck}.`
    );
    if (pmMatch) {
      errors.push(
        `Fix: run "corepack enable" and "corepack prepare pnpm@${pmMatch[2]} --activate" (or install pnpm@${pmMatch[2]}).`
      );
    }
  }
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

process.stdout.write('Tooling versions OK.\n');

