type RequestlyImportHeader = {
  operation: string;
  header: string;
  value: string;
};

type RequestlyImportExtensionRule = {
  action: {
    requestHeaders: RequestlyImportHeader[];
  };
};

type RequestlyImportProfile = {
  name: string;
  version: number;
  extensionRules: RequestlyImportExtensionRule[];
  status?: string;
};

type RequestlyImportData = RequestlyImportProfile[];

export function requestlyImportAdapter(data: RequestlyImportData) {
  return data.map(({ name, extensionRules, status }) => ({
    name,
    requestHeaders: extensionRules.flatMap(({ action }) => {
      const { requestHeaders } = action;
      const headers = requestHeaders
        .map(({ header, operation, value }) => {
          if (operation === 'set') {
            return {
              name: header,
              disabled: status !== 'Active',
              value,
            };
          }
        })
        .filter(Boolean);
      return headers;
    }),
  }));
}
