export function copyToClipboard(string: string) {
  navigator.clipboard.writeText(string).catch(error => {
    console.error('Error when copying to clipboard:', error);
  });
}
