type ModHeaderImportHeader = {
  enabled: boolean;
  name: string;
  value: string;
};

type ModHeaderImportProfile = {
  headers: ModHeaderImportHeader[];
  shortTitle: string;
  title: string;
  version: number;
};

type ModHeaderImportData = ModHeaderImportProfile[];

export function modheaderImportAdapter(data: ModHeaderImportData) {
  return data.map(({ title, headers }) => ({
    name: title,
    requestHeaders: headers.map(header => {
      const { enabled, ...other } = header;
      return {
        ...other,
        disabled: !enabled,
      };
    }),
  }));
}
