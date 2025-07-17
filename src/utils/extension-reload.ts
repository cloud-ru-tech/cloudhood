// Утилита для автоматической перезагрузки браузерного расширения в dev mode
export const enableExtensionReload = (): void => {
  if (process.env.NODE_ENV !== 'development') {
    console.warn('Extension reload is only available in development mode');
    return;
  }

  try {
    const ws = new WebSocket('ws://localhost:3333');

    ws.onmessage = event => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'reload') {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (globalThis as any).chrome?.runtime?.reload?.();
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onopen = () => {
      // eslint-disable-next-line no-console
      console.log('Extension reload WebSocket connected');
    };

    ws.onclose = () => {
      // eslint-disable-next-line no-console
      console.log('Extension reload WebSocket disconnected');
      if (process.env.NODE_ENV === 'development') {
        setTimeout(enableExtensionReload, 1000);
      }
    };

    ws.onerror = error => {
      console.error('Extension reload WebSocket error:', error);
    };
  } catch (error) {
    console.error('Failed to create WebSocket connection:', error);
  }
};
