export function downloadSelectedProfiles(profileExportString: string) {
  const blob = new Blob([profileExportString], { type: 'application/json' });

  const a = document.createElement('a');
  a.href = window.URL.createObjectURL(blob);
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1; // Months are zero-based (0 - January, 11 - December)
  const day = currentDate.getDate();
  const hours = currentDate.getHours();
  const minutes = currentDate.getMinutes();
  const seconds = currentDate.getSeconds();
  a.download = `Cloudhood_${day}-${month}-${year}_${hours}-${minutes}-${seconds}_profiles.json`;
  a.click();
  window.URL.revokeObjectURL(a.href);
}
