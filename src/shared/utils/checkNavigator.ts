export function doesNavigatorExist() {
  const isSupportClipboard = 'clipboard' in navigator;
  if (!isSupportClipboard) {
    throw new Error('Clipboard API is not supported in your browser');
  }
}
