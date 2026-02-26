export enum BrowserStorageKey {
  Profiles = 'requestHeaderProfilesV1',
  SelectedProfile = 'selectedHeaderProfileV1',
  IsPaused = 'isPausedV1',
  /** Monotonic version meta for any header-config change */
  HeadersConfigMeta = 'headersConfigMetaV1',
  ThemeMode = 'themeMode',
}

export enum RuntimeMessageType {
  ExportDebugLogs = 'export-debug-logs',
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
