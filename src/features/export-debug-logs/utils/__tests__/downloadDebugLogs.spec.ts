import { describe, expect, it } from 'vitest';

import { buildDebugLogsFilename } from '../downloadDebugLogs';

describe('buildDebugLogsFilename', () => {
  it('builds a timestamped debug logs filename', () => {
    const now = new Date(2026, 8, 9, 7, 5, 4);

    expect(buildDebugLogsFilename(now)).toBe('Cloudhood_debug_logs_2026-9-9_7-5-4.txt');
  });
});
