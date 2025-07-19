import { generateId } from '#shared/utils/generateId';

import { Profile } from './types';

export const DEFAULT_REQUEST_HEADERS: Profile[] = [
  {
    id: generateId().toString(),
    requestHeaders: [
      {
        id: generateId(),
        disabled: false,
        name: '',
        value: '',
        urlFilters: []
      },
    ],
  },
];
