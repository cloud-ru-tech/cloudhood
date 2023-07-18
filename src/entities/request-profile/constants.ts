import { generateId } from '#shared/utils/generateId';

import { Profiles } from './types';

export const DEFAULT_REQUEST_HEADERS: Profiles = new Map([
  [
    generateId().toString(),
    [
      {
        id: generateId(),
        disabled: false,
        name: '',
        value: '',
      },
    ],
  ],
]);
