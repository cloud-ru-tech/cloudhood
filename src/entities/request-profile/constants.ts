import { generateId } from '#shared/utils/generateId';

import { Profiles } from '../request-header/types';

export const DEFAULT_REQUEST_HEADERS: Profiles = {
  [generateId().toString()]: [
    {
      disabled: false,
      id: generateId(),
      name: '',
      value: '',
    },
  ],
};
