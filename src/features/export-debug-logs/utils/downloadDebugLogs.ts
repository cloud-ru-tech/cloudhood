export function buildDebugLogsFilename(
  now: Date,
  scope: 'general' | 'profile' = 'general',
  profileName?: string,
): string {
  const timestamp = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}_${now.getHours()}-${now.getMinutes()}-${now.getSeconds()}`;

  if (scope === 'profile') {
    const safeName = (profileName || 'profile').replace(/[^a-zA-Z0-9_-]+/g, '_').slice(0, 40);
    return `Cloudhood_debug_logs_profile_${safeName}_${timestamp}.txt`;
  }

  return `Cloudhood_debug_logs_${timestamp}.txt`;
}

export function downloadDebugLogs(payload: unknown, now: Date = new Date()): void {
  const scopedPayload = payload as { scope?: 'general' | 'profile'; profileName?: string; profile?: { name?: string } };
  const content = JSON.stringify(payload, null, 2);
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const a = document.createElement('a');
  a.href = window.URL.createObjectURL(blob);
  a.download = buildDebugLogsFilename(
    now,
    scopedPayload.scope,
    scopedPayload.profileName ?? scopedPayload.profile?.name,
  );
  a.click();
  window.URL.revokeObjectURL(a.href);
}
