export function readJSONFile(file: Blob) {
  return new Promise<string>((resolve, reject) => {
    const fileReader = new FileReader();

    fileReader.onload = e => {
      if (typeof e.target?.result === 'string') {
        resolve(e.target.result);
      } else {
        reject('File is not JSON');
      }
    };

    fileReader.onerror = error => reject(error.target?.error?.message);
    fileReader.readAsText(file);
  });
}
