import createCache from '@emotion/cache';
import { CacheProvider } from '@emotion/react';
import { ReactNode, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { getStyleNonce } from './shared/utils/csp';
import { enableExtensionReload } from './utils/extension-reload';

export function mountExtensionPage(children: ReactNode) {
  const nonce = getStyleNonce();
  const isFirefox = navigator.userAgent.toLowerCase().includes('firefox');

  const emotionCache = createCache({
    key: 'cloudhood-css',
    nonce,
    prepend: true,
    container: document.head,
    speedy: !isFirefox,
    ...(isFirefox && {
      insertionPoint: document.head.firstChild as HTMLElement,
    }),
  });

  if (process.env.NODE_ENV === 'development') {
    enableExtensionReload();
  }

  const root = createRoot(window.document.getElementById('app-container') as HTMLElement);

  root.render(
    <StrictMode>
      <CacheProvider value={emotionCache}>{children}</CacheProvider>
    </StrictMode>,
  );
}
