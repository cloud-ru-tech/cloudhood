export function buildDebugLogsFilename(now: Date): string {
  const timestamp = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}_${now.getHours()}-${now.getMinutes()}-${now.getSeconds()}`;
  return `Cloudhood_debug_logs_${timestamp}.txt`;
}

export function downloadDebugLogs(payload: unknown, now: Date = new Date()): void {
  const content = JSON.stringify(payload, null, 2);
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const a = document.createElement('a');
  a.href = window.URL.createObjectURL(blob);
  a.download = buildDebugLogsFilename(now);
  a.click();
  window.URL.revokeObjectURL(a.href);
}
