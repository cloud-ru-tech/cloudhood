import { allSettled, fork } from 'effector';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import browser from 'webextension-polyfill';

import { $selectedRequestProfile } from '#entities/request-profile/model';

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

    expect(sendMessage).toHaveBeenCalledWith({ type: 'export-debug-logs', profileId: undefined });
    expect(downloadDebugLogs).toHaveBeenCalledWith(payload);
  });

  it('downloads profile debug logs for the selected profile', async () => {
    const payload = { scope: 'profile', profileId: 'profile-1' };
    sendMessage.mockResolvedValue({ ok: true, result: payload });

    const scope = fork({
      values: [[$selectedRequestProfile, 'profile-1']],
    });
    await allSettled(profileDebugLogsExported, { scope });

    expect(sendMessage).toHaveBeenCalledWith({ type: 'export-debug-logs', profileId: 'profile-1' });
    expect(downloadDebugLogs).toHaveBeenCalledWith(payload);
  });

  it('does not download logs when the background response is unsuccessful', async () => {
    sendMessage.mockResolvedValue({ ok: false, error: 'boom' });

    const scope = fork();
    await allSettled(generalDebugLogsExported, { scope });

    expect(downloadDebugLogs).not.toHaveBeenCalled();
  });

  it('does not download profile logs when no profile is selected', async () => {
    const scope = fork({
      values: [[$selectedRequestProfile, '']],
    });
    await allSettled(profileDebugLogsExported, { scope });

    expect(sendMessage).not.toHaveBeenCalled();
    expect(downloadDebugLogs).not.toHaveBeenCalled();
  });
});
