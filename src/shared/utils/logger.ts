export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

/**
 * Конфигурация логгера
 */
export type LoggerConfig = {
  /** Минимальный уровень для вывода логов */
  minLevel: LogLevel;
  /** Включить отображение временных меток */
  showTimestamp: boolean;
  /** Включить логирование */
  enabled: boolean;
};

const defaultConfig: LoggerConfig = {
  minLevel: LogLevel.INFO,
  showTimestamp: true,
  enabled: true,
};

let currentConfig = { ...defaultConfig };

export function configureLogger(config: Partial<LoggerConfig>): void {
  currentConfig = { ...currentConfig, ...config };
}

export function disableLogger(): void {
  currentConfig.enabled = false;
}

export function enableLogger(): void {
  currentConfig.enabled = true;
}
function formatLogMessage(level: LogLevel, message: string): string {
  const timestamp = currentConfig.showTimestamp ? `[${new Date().toISOString()}] ` : '';
  return `${timestamp}[${level}] ${message}`;
}

function shouldLog(level: LogLevel): boolean {
  if (!currentConfig.enabled) return false;

  const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
  return levels.indexOf(level) >= levels.indexOf(currentConfig.minLevel);
}

export function logDebug(message: string, ...args: unknown[]): void {
  if (shouldLog(LogLevel.DEBUG)) {
    // eslint-disable-next-line no-console
    console.log(formatLogMessage(LogLevel.DEBUG, message), ...args);
  }
}

export function logInfo(message: string, ...args: unknown[]): void {
  if (shouldLog(LogLevel.INFO)) {
    // eslint-disable-next-line no-console
    console.info(formatLogMessage(LogLevel.INFO, message), ...args);
  }
}

export function logWarn(message: string, ...args: unknown[]): void {
  if (shouldLog(LogLevel.WARN)) {
    // eslint-disable-next-line no-console
    console.warn(formatLogMessage(LogLevel.WARN, message), ...args);
  }
}

export function logError(message: string, ...args: unknown[]): void {
  if (shouldLog(LogLevel.ERROR)) {
    // eslint-disable-next-line no-console
    console.error(formatLogMessage(LogLevel.ERROR, message), ...args);
  }
}

export function logGroup(title: string, collapsed = false): void {
  if (!currentConfig.enabled) return;

  if (collapsed) {
    // eslint-disable-next-line no-console
    console.groupCollapsed(title);
  } else {
    // eslint-disable-next-line no-console
    console.group(title);
  }
}

export function logGroupEnd(): void {
  if (!currentConfig.enabled) return;

  // eslint-disable-next-line no-console
  console.groupEnd();
}

export const logger = {
  debug: logDebug,
  info: logInfo,
  warn: logWarn,
  error: logError,
  group: logGroup,
  groupEnd: logGroupEnd,
  configure: configureLogger,
  enable: enableLogger,
  disable: disableLogger,
};
