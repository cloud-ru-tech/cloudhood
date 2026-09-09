import { BrowserStorageKey } from '#shared/constants';

export const COUNTERACT_BASE_ID = 1_000_000_000;

export type DebugLogsScope = 'general' | 'profile';

export type DebugLogsProfile = {
  id: string;
  name?: string;
  requestHeaders?: Array<{ id: number; name: string; value: string }>;
  requestCookies?: Array<{ name: string; value: string }>;
  urlFilters?: Array<{ value: string }>;
};

export type DebugLogEntry = {
  seq: number;
  timestamp: number;
  level: string;
  message: string;
  args: string[];
};

export type DebugLogsDnrSnapshot = {
  dynamicRulesCount: number;
  sessionRulesCount: number;
  dynamicRules: unknown[];
  sessionRules: unknown[];
};

export type DebugLogsExportPayload = {
  exportedAt: string;
  scope: DebugLogsScope;
  profileId?: string;
  profileName?: string;
  profile?: DebugLogsProfile;
  worker: unknown;
  health: unknown;
  storage: Record<string, unknown>;
  dnr: DebugLogsDnrSnapshot;
  logs: DebugLogEntry[];
};

export function parseProfilesFromStorage(storage: Record<string, unknown>): DebugLogsProfile[] {
  const raw = storage[BrowserStorageKey.Profiles];

  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw) as unknown;
      return Array.isArray(parsed) ? (parsed as DebugLogsProfile[]) : [];
    } catch {
      return [];
    }
  }

  return Array.isArray(raw) ? (raw as DebugLogsProfile[]) : [];
}

export function getProfileRuleIds(profile: DebugLogsProfile): Set<number> {
  const ids = new Set<number>();
  const urlFilterCount = Math.max(profile.urlFilters?.length ?? 0, 1);

  for (const header of profile.requestHeaders ?? []) {
    for (let index = 0; index < urlFilterCount; index += 1) {
      ids.add(header.id + index * 10000);
    }
  }

  return ids;
}

function isRuleWithId(rule: unknown): rule is { id: number } {
  return typeof rule === 'object' && rule !== null && typeof (rule as { id?: unknown }).id === 'number';
}

function getRuleHeaderNames(rule: unknown): string[] {
  if (typeof rule !== 'object' || rule === null) {
    return [];
  }

  const headers = (rule as { action?: { requestHeaders?: Array<{ header?: unknown }> } }).action?.requestHeaders ?? [];
  return headers
    .map(header => header.header)
    .filter((name): name is string => typeof name === 'string' && name.length > 0);
}

function isProfileRelatedRule(rule: unknown, ruleIds: Set<number>, headerNames: Set<string>): boolean {
  if (isRuleWithId(rule) && ruleIds.has(rule.id)) {
    return true;
  }

  return (
    isRuleWithId(rule) && rule.id >= COUNTERACT_BASE_ID && getRuleHeaderNames(rule).some(name => headerNames.has(name))
  );
}

function collectProfileNeedles(profile: DebugLogsProfile): string[] {
  return [
    profile.id,
    profile.name,
    ...(profile.requestHeaders ?? []).flatMap(header => [String(header.id), header.name, header.value]),
    ...(profile.requestCookies ?? []).flatMap(cookie => [cookie.name, cookie.value]),
    ...(profile.urlFilters ?? []).map(filter => filter.value),
  ].filter((value): value is string => Boolean(value && value.length > 0));
}

export function filterDebugLogsForProfile(
  payload: DebugLogsExportPayload,
  profile: DebugLogsProfile,
): DebugLogsExportPayload {
  const ruleIds = getProfileRuleIds(profile);
  const headerNames = new Set((profile.requestHeaders ?? []).map(header => header.name).filter(Boolean));
  const needles = collectProfileNeedles(profile);
  const dynamicRules = payload.dnr.dynamicRules.filter(rule => isProfileRelatedRule(rule, ruleIds, headerNames));
  const sessionRules = payload.dnr.sessionRules.filter(rule => isProfileRelatedRule(rule, ruleIds, headerNames));

  return {
    ...payload,
    scope: 'profile',
    profileId: profile.id,
    profileName: profile.name,
    profile,
    storage: {
      [BrowserStorageKey.SelectedProfile]: profile.id,
      [BrowserStorageKey.IsPaused]: payload.storage[BrowserStorageKey.IsPaused],
      [BrowserStorageKey.HeadersConfigMeta]: payload.storage[BrowserStorageKey.HeadersConfigMeta],
    },
    dnr: {
      dynamicRulesCount: dynamicRules.length,
      sessionRulesCount: sessionRules.length,
      dynamicRules,
      sessionRules,
    },
    logs: payload.logs.filter(entry => {
      const haystack = `${entry.message} ${entry.args.join(' ')}`;
      return needles.some(needle => haystack.includes(needle));
    }),
  };
}
