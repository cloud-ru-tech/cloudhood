import { describe, expect, it } from 'vitest';

import { buildDebugLogsFilename } from '../downloadDebugLogs';

describe('buildDebugLogsFilename', () => {
  const now = new Date(2026, 8, 9, 7, 5, 4);

  it('builds a timestamped debug logs filename', () => {
    expect(buildDebugLogsFilename(now)).toBe('Cloudhood_debug_logs_2026-9-9_7-5-4.txt');
  });

  it('includes a sanitized profile name for profile logs', () => {
    expect(buildDebugLogsFilename(now, 'profile', 'Work / QA')).toBe(
      'Cloudhood_debug_logs_profile_Work_QA_2026-9-9_7-5-4.txt',
    );
  });
});
