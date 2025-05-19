/**
 * Уровни логирования
 */
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

// Конфигурация по умолчанию
const defaultConfig: LoggerConfig = {
  minLevel: LogLevel.INFO,
  showTimestamp: true,
  enabled: true,
};

// Текущая конфигурация
let currentConfig = { ...defaultConfig };

/**
 * Установить конфигурацию логгера
 */
export function configureLogger(config: Partial<LoggerConfig>): void {
  currentConfig = { ...currentConfig, ...config };
}

/**
 * Отключить логирование
 */
export function disableLogger(): void {
  currentConfig.enabled = false;
}

/**
 * Включить логирование
 */
export function enableLogger(): void {
  currentConfig.enabled = true;
}

/**
 * Форматирование сообщения лога
 */
function formatLogMessage(level: LogLevel, message: string): string {
  const timestamp = currentConfig.showTimestamp ? `[${new Date().toISOString()}] ` : '';
  return `${timestamp}[${level}] ${message}`;
}

/**
 * Проверка, нужно ли логировать сообщение данного уровня
 */
function shouldLog(level: LogLevel): boolean {
  if (!currentConfig.enabled) return false;

  const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
  return levels.indexOf(level) >= levels.indexOf(currentConfig.minLevel);
}

/**
 * Логирование с уровнем DEBUG
 */
export function logDebug(message: string, ...args: unknown[]): void {
  if (shouldLog(LogLevel.DEBUG)) {
    // eslint-disable-next-line no-console
    console.log(formatLogMessage(LogLevel.DEBUG, message), ...args);
  }
}

/**
 * Логирование с уровнем INFO
 */
export function logInfo(message: string, ...args: unknown[]): void {
  if (shouldLog(LogLevel.INFO)) {
    // eslint-disable-next-line no-console
    console.info(formatLogMessage(LogLevel.INFO, message), ...args);
  }
}

/**
 * Логирование с уровнем WARN
 */
export function logWarn(message: string, ...args: unknown[]): void {
  if (shouldLog(LogLevel.WARN)) {
    // eslint-disable-next-line no-console
    console.warn(formatLogMessage(LogLevel.WARN, message), ...args);
  }
}

/**
 * Логирование с уровнем ERROR
 */
export function logError(message: string, ...args: unknown[]): void {
  if (shouldLog(LogLevel.ERROR)) {
    // eslint-disable-next-line no-console
    console.error(formatLogMessage(LogLevel.ERROR, message), ...args);
  }
}

/**
 * Группировка логов
 */
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

/**
 * Завершение группы логов
 */
export function logGroupEnd(): void {
  if (!currentConfig.enabled) return;

  // eslint-disable-next-line no-console
  console.groupEnd();
}

// Экспортируем для удобства использования
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
