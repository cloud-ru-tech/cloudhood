#!/usr/bin/env node

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const SEVERITY_ORDER = { CRITICAL: 4, HIGH: 3, MODERATE: 2, MEDIUM: 2, LOW: 1, UNKNOWN: 0 };
const DISPLAY_SEVERITY = { MEDIUM: 'MODERATE' };
const SOURCE_FILES = {
  pnpm: 'pnpm-audit.json',
  osv: 'osv.json',
  trivy: 'trivy.json',
};

const args = Object.fromEntries(
  process.argv.slice(2).reduce((pairs, value, index, values) => {
    if (value.startsWith('--'))
      pairs.push([value.slice(2), values[index + 1]?.startsWith('--') ? 'true' : (values[index + 1] ?? 'true')]);
    return pairs;
  }, []),
);
const reportsDir = resolve(args['reports-dir'] ?? 'reports');
const baselineDir = args['baseline-dir'] ? resolve(args['baseline-dir']) : null;
const exceptionsPath = resolve(args.exceptions ?? '.github/security/vulnerability-exceptions.json');
const eventName = args['event-name'] ?? process.env.GITHUB_EVENT_NAME ?? 'local';

function normalizeSeverity(value) {
  const normalized = String(value ?? 'UNKNOWN').toUpperCase();
  return DISPLAY_SEVERITY[normalized] ?? (SEVERITY_ORDER[normalized] === undefined ? 'UNKNOWN' : normalized);
}

function severityFromCvss(value) {
  const score = Number(value);
  if (!Number.isFinite(score)) return 'UNKNOWN';
  if (score >= 9) return 'CRITICAL';
  if (score >= 7) return 'HIGH';
  if (score >= 4) return 'MODERATE';
  return 'LOW';
}

function bestSeverity(...values) {
  return values.map(normalizeSeverity).sort((a, b) => SEVERITY_ORDER[b] - SEVERITY_ORDER[a])[0] ?? 'UNKNOWN';
}

function idsFrom(...values) {
  const found = new Set();
  for (const value of values.flat(Infinity)) {
    if (typeof value !== 'string') continue;
    const matches = value.toUpperCase().match(/(?:CVE-\d{4}-\d{4,}|GHSA-[\w-]{4,}|[A-Z][A-Z0-9_.-]*-\d{4,}-\d+)/g);
    if (matches) matches.forEach(id => found.add(id));
  }
  return [...found];
}

function firstString(...values) {
  return values.flat(Infinity).find(value => typeof value === 'string' && value.trim()) ?? '';
}

async function readJson(path) {
  try {
    return { ok: true, value: JSON.parse(await readFile(path, 'utf8')) };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

async function readPackageTypes(directory) {
  const result = await readJson(join(directory, 'package.json'));
  const prod = new Set(Object.keys(result.value?.dependencies ?? {}));
  const dev = new Set(Object.keys(result.value?.devDependencies ?? {}));
  return { prod, dev };
}

function packageClass(name, packageTypes) {
  if (packageTypes.prod.has(name)) return { dependencyType: 'direct', environment: 'prod' };
  if (packageTypes.dev.has(name)) return { dependencyType: 'direct', environment: 'dev' };
  return { dependencyType: 'transitive', environment: 'unknown' };
}

function vulnerableRange(affected, name) {
  const match = (affected ?? []).find(item => item.package?.name === name) ?? affected?.[0];
  return (match?.ranges ?? [])
    .flatMap(range => range.events ?? [])
    .map(event => (event.introduced ? `introduced ${event.introduced}` : event.fixed ? `fixed ${event.fixed}` : ''))
    .filter(Boolean)
    .join(', ');
}

function fixedFromAffected(affected, name) {
  const match = (affected ?? []).find(item => item.package?.name === name) ?? affected?.[0];
  return (
    (match?.ranges ?? [])
      .flatMap(range => range.events ?? [])
      .map(event => event.fixed)
      .find(Boolean) ?? ''
  );
}

function pnpmFindings(report, packageTypes) {
  const findings = [];
  if (report?.advisories && typeof report.advisories === 'object') {
    for (const advisory of Object.values(report.advisories)) {
      const name = advisory.module_name ?? advisory.name ?? 'unknown';
      findings.push({
        source: 'pnpm audit',
        ids: idsFrom(advisory.github_advisory_id, advisory.cves, advisory.url, advisory.title),
        severity: normalizeSeverity(advisory.severity),
        packageName: name,
        installedVersion: firstString(advisory.findings?.map(finding => finding.version)),
        vulnerableRange: advisory.vulnerable_versions ?? '',
        fixedVersion: advisory.patched_versions ?? '',
        fixAvailable: Boolean(advisory.patched_versions && advisory.patched_versions !== '<0.0.0'),
        urls: [advisory.url].filter(Boolean),
        path: firstString(advisory.findings?.flatMap(finding => finding.paths)),
        ...packageClass(name, packageTypes),
      });
    }
  }
  if (report?.vulnerabilities && typeof report.vulnerabilities === 'object') {
    for (const [name, vulnerability] of Object.entries(report.vulnerabilities)) {
      const via = Array.isArray(vulnerability.via) ? vulnerability.via : [vulnerability.via];
      const advisories = via.filter(item => item && typeof item === 'object');
      for (const advisory of advisories.length ? advisories : [{}]) {
        const fix = vulnerability.fixAvailable;
        findings.push({
          source: 'pnpm audit',
          ids: idsFrom(
            advisory.url,
            advisory.source,
            advisory.name,
            advisory.title,
            via.filter(item => typeof item === 'string'),
          ),
          severity: bestSeverity(advisory.severity, vulnerability.severity),
          packageName: name,
          installedVersion: vulnerability.version ?? '',
          vulnerableRange: advisory.range ?? vulnerability.range ?? '',
          fixedVersion: typeof fix === 'object' ? (fix.version ?? '') : '',
          fixAvailable: Boolean(fix),
          urls: [advisory.url].filter(Boolean),
          path: '',
          ...packageClass(name, packageTypes),
        });
      }
    }
  }
  return findings;
}

function osvFindings(report, packageTypes) {
  const findings = [];
  for (const result of report?.results ?? []) {
    for (const item of result.packages ?? []) {
      const pkg = item.package ?? item;
      for (const vulnerability of item.vulnerabilities ?? []) {
        const severity = bestSeverity(
          vulnerability.database_specific?.severity,
          vulnerability.ecosystem_specific?.severity,
          ...(vulnerability.severity ?? []).map(entry =>
            severityFromCvss(String(entry.score ?? '').match(/[0-9]+(?:\.[0-9]+)?/)?.[0]),
          ),
        );
        const name = pkg.name ?? 'unknown';
        findings.push({
          source: 'OSV',
          ids: idsFrom(vulnerability.id, vulnerability.aliases, vulnerability.related),
          severity,
          packageName: name,
          installedVersion: pkg.version ?? '',
          vulnerableRange: vulnerableRange(vulnerability.affected, name),
          fixedVersion: fixedFromAffected(vulnerability.affected, name),
          fixAvailable: Boolean(fixedFromAffected(vulnerability.affected, name)),
          urls: [
            vulnerability.database_specific?.url,
            ...(vulnerability.references ?? []).map(reference => reference.url),
          ].filter(Boolean),
          path: result.source?.path ?? result.source?.file ?? '',
          exploited: Boolean(
            vulnerability.database_specific?.known_exploited || vulnerability.database_specific?.actively_exploited,
          ),
          ...packageClass(name, packageTypes),
        });
      }
    }
  }
  return findings;
}

function trivyFindings(report, packageTypes) {
  const findings = [];
  for (const result of report?.Results ?? []) {
    for (const vulnerability of result.Vulnerabilities ?? []) {
      const name = vulnerability.PkgName ?? 'unknown';
      const cvssScores = Object.values(vulnerability.CVSS ?? {}).map(cvss => cvss.V3Score ?? cvss.V2Score);
      findings.push({
        source: 'Trivy',
        ids: idsFrom(vulnerability.VulnerabilityID, vulnerability.Title, vulnerability.References),
        severity: bestSeverity(vulnerability.Severity, ...cvssScores.map(severityFromCvss)),
        packageName: name,
        installedVersion: vulnerability.InstalledVersion ?? '',
        vulnerableRange: vulnerability.VulnerableVersion ?? '',
        fixedVersion: vulnerability.FixedVersion ?? '',
        fixAvailable: Boolean(vulnerability.FixedVersion),
        urls: [vulnerability.PrimaryURL, ...(vulnerability.References ?? [])].filter(Boolean),
        path: result.Target ?? '',
        exploited: Boolean(
          vulnerability.KnownExploited ||
          vulnerability.ActivelyExploited ||
          (vulnerability.Status === 'affected' && vulnerability.Custom?.KnownExploited),
        ),
        ...packageClass(name, packageTypes),
      });
    }
  }
  return findings;
}

function addFinding(index, finding) {
  const ids = finding.ids.length ? finding.ids : [`UNIDENTIFIED:${finding.packageName}:${finding.installedVersion}`];
  const matchingKeys = ids.map(id => index.aliasToKey.get(id)).filter(Boolean);
  const key = matchingKeys[0] ?? ids[0];
  let entry = index.entries.get(key);
  if (!entry) {
    entry = {
      ids: new Set(),
      sources: new Set(),
      severities: new Map(),
      packages: new Map(),
      urls: new Set(),
      paths: new Set(),
      exploited: false,
    };
    index.entries.set(key, entry);
  }
  for (const otherKey of matchingKeys.slice(1)) {
    if (otherKey === key) continue;
    const other = index.entries.get(otherKey);
    if (!other) continue;
    for (const id of other.ids) (entry.ids.add(id), index.aliasToKey.set(id, key));
    for (const source of other.sources) entry.sources.add(source);
    for (const [source, severity] of other.severities)
      entry.severities.set(source, bestSeverity(entry.severities.get(source), severity));
    for (const [packageKey, packageInfo] of other.packages) entry.packages.set(packageKey, packageInfo);
    for (const url of other.urls) entry.urls.add(url);
    for (const path of other.paths) entry.paths.add(path);
    entry.exploited ||= other.exploited;
    index.entries.delete(otherKey);
  }
  for (const id of ids) (entry.ids.add(id), index.aliasToKey.set(id, key));
  entry.sources.add(finding.source);
  entry.severities.set(finding.source, bestSeverity(entry.severities.get(finding.source), finding.severity));
  let packageKey = `${finding.packageName}@${finding.installedVersion}`;
  const packageWithMissingVersion = [...entry.packages.entries()].find(
    ([, pkg]) => pkg.packageName === finding.packageName && (!pkg.installedVersion || !finding.installedVersion),
  );
  if (packageWithMissingVersion) packageKey = packageWithMissingVersion[0];
  const current = entry.packages.get(packageKey) ?? { ...finding };
  current.installedVersion ||= finding.installedVersion;
  current.dependencyType =
    current.dependencyType === 'direct' || finding.dependencyType === 'direct' ? 'direct' : 'transitive';
  current.environment =
    current.environment === 'prod' || finding.environment === 'prod'
      ? 'prod'
      : current.environment === 'dev' || finding.environment === 'dev'
        ? 'dev'
        : 'unknown';
  current.fixedVersion ||= finding.fixedVersion;
  current.vulnerableRange ||= finding.vulnerableRange;
  current.fixAvailable ||= finding.fixAvailable;
  entry.packages.set(packageKey, current);
  finding.urls.forEach(url => entry.urls.add(url));
  if (finding.path) entry.paths.add(finding.path);
  entry.exploited ||= Boolean(finding.exploited);
}

async function loadScan(directory) {
  const packageTypes = await readPackageTypes(directory === reportsDir ? process.cwd() : join(directory, 'source'));
  const index = { entries: new Map(), aliasToKey: new Map() };
  const status = await readJson(join(directory, 'scanner-status.json'));
  const errors = [];
  const counts = {};
  for (const [source, file] of Object.entries(SOURCE_FILES)) {
    const report = await readJson(join(directory, file));
    const scanner = status.value?.scanners?.[source];
    if (!report.ok) {
      errors.push(`${source}: report is missing or invalid JSON (${report.error})`);
      counts[source] = 0;
      continue;
    }
    if (!scanner) errors.push(`${source}: scanner status is missing`);
    else if (scanner.status !== 'success')
      errors.push(`${source}: ${scanner.message ?? 'scanner failed'} (exit ${scanner.exitCode ?? 'unknown'})`);
    const parser = { pnpm: pnpmFindings, osv: osvFindings, trivy: trivyFindings }[source];
    const findings = parser(report.value, packageTypes);
    counts[source] = findings.length;
    findings.forEach(finding => addFinding(index, finding));
  }
  return {
    entries: [...index.entries.values()].map(entry => ({
      ...entry,
      ids: [...entry.ids].sort(),
      sources: [...entry.sources].sort(),
      severity: bestSeverity(...entry.severities.values()),
      packages: [...entry.packages.values()],
      urls: [...entry.urls].sort(),
      paths: [...entry.paths].sort(),
    })),
    errors,
    counts,
    scannerStatus: status.value?.scanners ?? {},
  };
}

function validateExceptions(raw) {
  const errors = [];
  const valid = [];
  if (!raw || !Array.isArray(raw.exceptions))
    return { valid, errors: ['exceptions must be an object with an exceptions array'] };
  const now = new Date();
  for (const [index, exception] of raw.exceptions.entries()) {
    const label = `exceptions[${index}]`;
    if (!exception || typeof exception !== 'object') {
      errors.push(`${label} must be an object`);
      continue;
    }
    const required = ['id', 'reason', 'owner', 'expires', 'issue'];
    for (const field of required)
      if (typeof exception[field] !== 'string' || !exception[field].trim())
        errors.push(`${label}.${field} is required`);
    if (!/^(?:CVE-\d{4}-\d{4,}|GHSA-[\w-]{4,}|[A-Z][A-Z0-9_.-]*-\d{4,}-\d+)$/i.test(exception.id ?? ''))
      errors.push(`${label}.id must be a concrete CVE, GHSA, or OSV id`);
    if (/[?*]/.test(exception.id ?? '')) errors.push(`${label}.id must not contain wildcards`);
    if (!String(exception.owner ?? '').startsWith('@'))
      errors.push(`${label}.owner must be a GitHub handle beginning with @`);
    if (!/^https:\/\/github\.com\/.+\/issues\/\d+\/?$/.test(exception.issue ?? ''))
      errors.push(`${label}.issue must be a GitHub issue URL`);
    const expiry = new Date(`${exception.expires}T23:59:59.999Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(exception.expires ?? '') || Number.isNaN(expiry.valueOf()))
      errors.push(`${label}.expires must be YYYY-MM-DD`);
    else if (expiry < now) errors.push(`${label} is expired (${exception.expires})`);
    else if (expiry.valueOf() - now.valueOf() > 30 * 24 * 60 * 60 * 1000)
      errors.push(`${label}.expires must be no more than 30 days away`);
    if (!errors.some(error => error.startsWith(label))) valid.push({ ...exception, id: exception.id.toUpperCase() });
  }
  return { valid, errors };
}

function md(value) {
  return String(value ?? '')
    .replaceAll('|', '\\|')
    .replaceAll('\n', '<br>');
}
function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function sarif(entries) {
  const rules = entries.map(entry => ({
    id: entry.ids[0],
    name: entry.ids[0],
    shortDescription: { text: entry.ids.join(', ') },
    helpUri: entry.urls[0],
  }));
  return {
    version: '2.1.0',
    $schema: 'https://json.schemastore.org/sarif-2.1.0.json',
    runs: [
      {
        tool: { driver: { name: 'Cloudhood dependency vulnerability aggregation', rules } },
        results: entries.map(entry => ({
          ruleId: entry.ids[0],
          level: SEVERITY_ORDER[entry.severity] >= 3 ? 'error' : 'warning',
          message: {
            text: `${entry.severity}: ${entry.packages.map(pkg => `${pkg.packageName}@${pkg.installedVersion}`).join(', ')}`,
          },
          locations: entry.paths.slice(0, 1).map(path => ({ physicalLocation: { artifactLocation: { uri: path } } })),
        })),
      },
    ],
  };
}

const current = await loadScan(reportsDir);
const baseline = baselineDir ? await loadScan(baselineDir) : null;
const scannerErrors = [...current.errors, ...(baseline ? baseline.errors.map(error => `baseline ${error}`) : [])];
const rawExceptions = await readJson(exceptionsPath);
const exceptions = rawExceptions.ok
  ? validateExceptions(rawExceptions.value)
  : { valid: [], errors: [`Unable to read exceptions: ${rawExceptions.error}`] };
const baselineSeverity = new Map();
for (const entry of baseline?.entries ?? [])
  for (const id of entry.ids) baselineSeverity.set(id, bestSeverity(baselineSeverity.get(id), entry.severity));

let blocking = 0;
let warnings = 0;
let deduplicated = 0;
const accepted = [];
const rows = current.entries.sort(
  (a, b) => SEVERITY_ORDER[b.severity] - SEVERITY_ORDER[a.severity] || a.ids[0].localeCompare(b.ids[0]),
);
for (const entry of rows) {
  deduplicated += Math.max(0, entry.sources.length - 1);
  const exception = exceptions.valid.find(candidate => entry.ids.includes(candidate.id));
  const previous = bestSeverity(...entry.ids.map(id => baselineSeverity.get(id)));
  const isHigh = SEVERITY_ORDER[entry.severity] >= SEVERITY_ORDER.HIGH;
  let status = 'warning';
  if (exception) {
    status = 'temporarily accepted';
    accepted.push({ entry, exception });
  } else if (isHigh) {
    status = 'blocking';
    blocking += 1;
  } else {
    warnings += 1;
  }
  entry.status = status;
  entry.previousSeverity = previous;
}

const sourceTotals = Object.entries(current.counts)
  .map(([source, count]) => `${source}: ${count}`)
  .join(', ');
const severityDifferences = rows.filter(entry => new Set(entry.severities.values()).size > 1);
const important = rows.filter(entry => entry.exploited || entry.packages.some(pkg => pkg.environment === 'prod'));
const summary = [
  '## Dependency vulnerability report',
  '',
  `- Mode: **full dependency tree** (HIGH/CRITICAL block merge)`,
  `- Unique vulnerabilities: **${rows.length}**; deduplicated source matches: **${deduplicated}**`,
  `- Raw findings: ${sourceTotals}`,
  `- Scanner data/scans completed: ${
    Object.entries(current.scannerStatus)
      .map(([name, value]) => `${name}: ${value.completedAt ?? 'unknown'}`)
      .join(', ') || 'not recorded'
  }`,
  '',
  '| Severity | Dependency | Installed | Fixed in | Direct/Transitive | Prod/Dev | IDs | Sources | Status |',
  '| --- | --- | --- | --- | --- | --- | --- | --- | --- |',
  ...rows.map(entry => {
    const packages = entry.packages;
    return `| ${entry.severity} | ${md(packages.map(pkg => pkg.packageName).join(', '))} | ${md(packages.map(pkg => pkg.installedVersion).join(', '))} | ${md(unique(packages.map(pkg => pkg.fixedVersion)).join(', ') || 'No fix published')} | ${md(unique(packages.map(pkg => pkg.dependencyType)).join(', '))} | ${md(unique(packages.map(pkg => pkg.environment)).join(', '))} | ${md(entry.ids.join(', '))} | ${md([...entry.sources].join(', '))} | ${entry.status}${entry.exploited ? ' (known/actively exploited)' : ''} |`;
  }),
  ...scannerErrors.map(error => `| UNKNOWN | scanner | — | — | — | — | — | — | scanner error: ${md(error)} |`),
  '',
  '### Scanner errors',
  ...(scannerErrors.length ? scannerErrors.map(error => `- ${error}`) : ['- None']),
  '',
  '### Severity differences between sources',
  ...(severityDifferences.length
    ? severityDifferences.map(
        entry =>
          `- ${entry.ids.join(', ')}: ${[...entry.severities].map(([source, severity]) => `${source}=${severity}`).join(', ')}`,
      )
    : ['- None']),
  '',
  '### Temporarily accepted exceptions',
  ...(accepted.length
    ? accepted.map(
        ({ entry, exception }) =>
          `- ${entry.ids.join(', ')} until ${exception.expires}; ${exception.issue} — ${exception.reason}`,
      )
    : ['- None']),
  '',
  '### Transitive dependency paths',
  ...(rows
    .filter(entry => entry.packages.some(pkg => pkg.dependencyType === 'transitive'))
    .map(
      entry =>
        `- ${entry.ids.join(', ')}: ${entry.paths.length ? entry.paths.join('; ') : 'not reported by the scanner'}`,
    ).length
    ? rows
        .filter(entry => entry.packages.some(pkg => pkg.dependencyType === 'transitive'))
        .map(
          entry =>
            `- ${entry.ids.join(', ')}: ${entry.paths.length ? entry.paths.join('; ') : 'not reported by the scanner'}`,
        )
    : ['- No transitive findings.']),
  '',
  '### Recommended remediation',
  ...(rows
    .filter(entry => entry.status !== 'temporarily accepted')
    .map(entry => {
      const fixes = unique(entry.packages.map(pkg => pkg.fixedVersion));
      return `- ${entry.ids.join(', ')}: update ${entry.packages.map(pkg => pkg.packageName).join(', ')}${fixes.length ? ` to ${fixes.join(', ')}` : '; no fixed version is currently reported'}.`;
    }).length
    ? rows
        .filter(entry => entry.status !== 'temporarily accepted')
        .map(entry => {
          const fixes = unique(entry.packages.map(pkg => pkg.fixedVersion));
          return `- ${entry.ids.join(', ')}: update ${entry.packages.map(pkg => pkg.packageName).join(', ')}${fixes.length ? ` to ${fixes.join(', ')}` : '; no fixed version is currently reported'}.`;
        })
    : ['- No remediation required.']),
  ...(important.length
    ? [
        '',
        '### Important exposure',
        ...important.map(
          entry =>
            `- ${entry.ids.join(', ')} affects ${entry.packages.map(pkg => pkg.packageName).join(', ')}${entry.exploited ? ' and is marked known/actively exploited' : ' and includes a production dependency'}.`,
        ),
      ]
    : []),
];

await mkdir(reportsDir, { recursive: true });
await writeFile(join(reportsDir, 'vulnerabilities.sarif'), `${JSON.stringify(sarif(rows), null, 2)}\n`);
await writeFile(
  join(reportsDir, 'aggregate.json'),
  `${JSON.stringify({ generatedAt: new Date().toISOString(), eventName, current: rows, scannerErrors, exceptionErrors: exceptions.errors }, null, 2)}\n`,
);
await writeFile(join(reportsDir, 'summary.md'), `${summary.join('\n')}\n`);
if (process.env.GITHUB_STEP_SUMMARY)
  await writeFile(process.env.GITHUB_STEP_SUMMARY, `${summary.join('\n')}\n`, { flag: 'a' });

if (exceptions.errors.length) {
  console.error(`Invalid vulnerability exception policy:\n${exceptions.errors.map(error => `- ${error}`).join('\n')}`);
  process.exitCode = 2;
} else if (scannerErrors.length) {
  console.error(`One or more required scanners failed:\n${scannerErrors.map(error => `- ${error}`).join('\n')}`);
  process.exitCode = 2;
} else if (blocking) {
  console.error(`${blocking} vulnerability finding(s) violate the full-tree HIGH/CRITICAL policy.`);
  process.exitCode = 1;
} else {
  console.log('Dependency vulnerability policy passed.');
}
