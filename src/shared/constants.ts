export enum BrowserStorageKey {
  Profiles = 'requestHeaderProfilesV1',
  SelectedProfile = 'selectedHeaderProfileV1',
  IsPaused = 'isPausedV1',
  /** Monotonic version meta for any header-config change */
  HeadersConfigMeta = 'headersConfigMetaV1',
  /** Enable mirroring extension logs to the active tab console */
  MirrorLogsToPageConsole = 'mirrorLogsToPageConsoleV1',
  ThemeMode = 'themeMode',
}

export enum Extensions {
  ModHeader = 'modheader',
  Requestly = 'requestly',
}

export enum ThemeMode {
  Light = 'light',
  Dark = 'dark',
  System = 'system',
}
