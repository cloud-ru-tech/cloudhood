import { describe, expect, it } from 'vitest';

import { BrowserStorageKey } from '#shared/constants';

import {
  COUNTERACT_BASE_ID,
  type DebugLogsExportPayload,
  type DebugLogsProfile,
  filterDebugLogsForProfile,
  getProfileRuleIds,
  parseProfilesFromStorage,
} from '../debugLogsExport';

const profile: DebugLogsProfile = {
  id: 'profile-1',
  name: 'Work',
  requestHeaders: [{ id: 42, name: 'X-Test', value: 'abc' }],
  requestCookies: [{ name: 'session', value: 'tok' }],
  urlFilters: [],
};

function createPayload(overrides: Partial<DebugLogsExportPayload> = {}): DebugLogsExportPayload {
  return {
    exportedAt: '2026-09-09T00:00:00.000Z',
    scope: 'general',
    worker: { bootId: 'w1' },
    health: { applyCounter: 1 },
    storage: {
      [BrowserStorageKey.Profiles]: JSON.stringify([profile]),
      [BrowserStorageKey.SelectedProfile]: 'profile-1',
      [BrowserStorageKey.IsPaused]: false,
    },
    dnr: {
      dynamicRulesCount: 2,
      sessionRulesCount: 1,
      dynamicRules: [{ id: 42 }, { id: 99 }],
      sessionRules: [
        { id: COUNTERACT_BASE_ID, action: { requestHeaders: [{ header: 'X-Test' }] } },
        { id: COUNTERACT_BASE_ID + 1, action: { requestHeaders: [{ header: 'Other' }] } },
      ],
    },
    logs: [
      { seq: 1, timestamp: 1, level: 'INFO', message: 'Apply profile-1', args: [] },
      { seq: 2, timestamp: 2, level: 'INFO', message: 'Unrelated', args: ['other'] },
      { seq: 3, timestamp: 3, level: 'INFO', message: 'Header', args: ['X-Test'] },
    ],
    ...overrides,
  };
}

describe('debugLogsExport', () => {
  it('parses profiles from a JSON storage string', () => {
    expect(parseProfilesFromStorage({ [BrowserStorageKey.Profiles]: JSON.stringify([profile]) })).toEqual([profile]);
  });

  it('collects header and counteracting rule ids for a profile', () => {
    expect(getProfileRuleIds(profile)).toEqual(new Set([42]));
  });

  it('keeps only profile-related rules and logs', () => {
    const filtered = filterDebugLogsForProfile(createPayload(), profile);

    expect(filtered.scope).toBe('profile');
    expect(filtered.profileId).toBe('profile-1');
    expect(filtered.dnr.dynamicRules).toEqual([{ id: 42 }]);
    expect(filtered.dnr.sessionRules).toEqual([
      { id: COUNTERACT_BASE_ID, action: { requestHeaders: [{ header: 'X-Test' }] } },
    ]);
    expect(filtered.logs.map(entry => entry.seq)).toEqual([1, 3]);
    expect(filtered.profile).toEqual(profile);
  });
});
