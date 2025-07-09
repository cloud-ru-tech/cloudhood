import browser from 'webextension-polyfill';

/**
 * Утилиты для работы с Content Security Policy
 */

/**
 * Определяет текущий браузер
 */
export function getBrowserType(): 'chrome' | 'firefox' | 'unknown' {
  if (!browser) {
    return 'unknown';
  }

  const userAgent = navigator.userAgent.toLowerCase();

  if (userAgent.includes('firefox')) {
    return 'firefox';
  }

  if (userAgent.includes('chrome') || userAgent.includes('chromium')) {
    return 'chrome';
  }

  return 'chrome';
}

/**
 * Получает nonce из мета-тега или возвращает фиксированный
 */
export function getStyleNonce(): string {
  const FIXED_NONCE = 'cloudhood-extension-style-nonce';

  let meta = document.querySelector('meta[name="style-nonce"]') as HTMLMetaElement;

  if (!meta) {
    meta = document.createElement('meta');
    meta.name = 'style-nonce';
    meta.content = FIXED_NONCE;
    document.head.appendChild(meta);
  } else if (meta.content !== FIXED_NONCE) {
    meta.content = FIXED_NONCE;
  }

  return FIXED_NONCE;
}

export function supportsCSPNonce(): boolean {
  const browserType = getBrowserType();

  return browserType === 'chrome' || browserType === 'firefox';
}
