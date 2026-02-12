(function () {
  const MESSAGE_TYPE = 'cloudhood:page-console-log';
  const runtimeApi =
    (typeof browser !== 'undefined' && browser.runtime && browser.runtime.onMessage && browser.runtime) ||
    (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage && chrome.runtime) ||
    null;

  if (!runtimeApi) return;

  runtimeApi.onMessage.addListener(message => {
    if (!message || message.type !== MESSAGE_TYPE || !message.payload) return;

    const payload = message.payload;
    const prefix = `[Cloudhood:${payload.source || 'unknown'}][${payload.level || 'INFO'}][#${payload.seq ?? '?'}]`;
    const details = Array.isArray(payload.args) ? payload.args.join('\n') : '';
    const fullMessage = details ? `${prefix} ${payload.message}\n${details}` : `${prefix} ${payload.message}`;

    if (payload.consoleMethod === 'error') {
      console.error(fullMessage);
    } else if (payload.consoleMethod === 'warn') {
      console.warn(fullMessage);
    } else {
      console.info(fullMessage);
    }
  });
})();
