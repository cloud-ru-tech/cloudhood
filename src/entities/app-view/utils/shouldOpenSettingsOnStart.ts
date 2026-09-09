export function shouldOpenSettingsOnStart(location: Pick<Location, 'pathname' | 'search' | 'hash'>): boolean {
  const params = new URLSearchParams(location.search);

  return (
    location.pathname.endsWith('options.html') || params.get('view') === 'settings' || location.hash === '#settings'
  );
}
