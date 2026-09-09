import { allSettled, fork } from 'effector';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import browser from 'webextension-polyfill';

import { $requestProfiles, $selectedRequestProfile } from '#entities/request-profile/model';

import { generalDebugLogsExported, profileDebugLogsExported } from '../model';
import { downloadDebugLogs } from '../utils';

vi.mock('webextension-polyfill', () => ({
  default: {
    runtime: {
      sendMessage: vi.fn(),
    },
    storage: {
      local: {
        get: vi.fn().mockResolvedValue({}),
        set: vi.fn().mockResolvedValue(undefined),
      },
      onChanged: {
        addListener: vi.fn(),
      },
    },
  },
}));

vi.mock('#entities/notification/utils', () => ({
  showToast: vi.fn(),
}));

vi.mock('../utils', () => ({
  downloadDebugLogs: vi.fn(),
}));

const sendMessage = browser.runtime.sendMessage as unknown as ReturnType<typeof vi.fn>;

describe('export-debug-logs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('downloads general debug logs', async () => {
    const payload = { scope: 'general', logs: [{ message: 'hello' }] };
    sendMessage.mockResolvedValue({ ok: true, result: payload });

    const scope = fork();
    await allSettled(generalDebugLogsExported, { scope });

    expect(sendMessage).toHaveBeenCalledWith({
      type: 'export-debug-logs',
      scope: 'general',
      profileId: undefined,
      profile: undefined,
    });
    expect(downloadDebugLogs).toHaveBeenCalledWith(payload);
  });

  it('downloads profile debug logs for the selected profile', async () => {
    const selectedProfile = {
      id: 'profile-1',
      name: 'Work',
      requestHeaders: [],
      requestCookies: [],
      urlFilters: [],
    };
    const payload = { scope: 'profile', profileId: 'profile-1' };
    sendMessage.mockResolvedValue({ ok: true, result: payload });

    const scope = fork({
      values: [
        [$selectedRequestProfile, 'profile-1'],
        [$requestProfiles, [selectedProfile]],
      ],
    });
    await allSettled(profileDebugLogsExported, { scope });

    expect(sendMessage).toHaveBeenCalledWith({
      type: 'export-debug-logs',
      scope: 'profile',
      profileId: 'profile-1',
      profile: selectedProfile,
    });
    expect(downloadDebugLogs).toHaveBeenCalledWith(payload);
  });

  it('does not download logs when the background response is unsuccessful', async () => {
    sendMessage.mockResolvedValue({ ok: false, error: 'boom' });

    const scope = fork();
    await allSettled(generalDebugLogsExported, { scope });

    expect(downloadDebugLogs).not.toHaveBeenCalled();
  });

  it('falls back to the first profile when none is selected', async () => {
    const fallbackProfile = {
      id: 'profile-2',
      name: 'Fallback',
      requestHeaders: [],
      requestCookies: [],
      urlFilters: [],
    };
    sendMessage.mockResolvedValue({ ok: true, result: { scope: 'profile' } });

    const scope = fork({
      values: [
        [$selectedRequestProfile, ''],
        [$requestProfiles, [fallbackProfile]],
      ],
    });
    await allSettled(profileDebugLogsExported, { scope });

    expect(sendMessage).toHaveBeenCalledWith({
      type: 'export-debug-logs',
      scope: 'profile',
      profileId: 'profile-2',
      profile: fallbackProfile,
    });
  });
});
