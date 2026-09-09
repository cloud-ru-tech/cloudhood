import { allSettled, fork } from 'effector';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import browser from 'webextension-polyfill';

import { debugLogsExported } from '../model';
import { downloadDebugLogs } from '../utils';

vi.mock('webextension-polyfill', () => ({
  default: {
    runtime: {
      sendMessage: vi.fn(),
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

  it('downloads debug logs when the background responds with a payload', async () => {
    const payload = { logs: [{ message: 'hello' }] };
    sendMessage.mockResolvedValue({ ok: true, result: payload });

    const scope = fork();
    await allSettled(debugLogsExported, { scope });

    expect(sendMessage).toHaveBeenCalledWith({ type: 'export-debug-logs' });
    expect(downloadDebugLogs).toHaveBeenCalledWith(payload);
  });

  it('does not download logs when the background response is unsuccessful', async () => {
    sendMessage.mockResolvedValue({ ok: false, error: 'boom' });

    const scope = fork();
    await allSettled(debugLogsExported, { scope });

    expect(downloadDebugLogs).not.toHaveBeenCalled();
  });
});
