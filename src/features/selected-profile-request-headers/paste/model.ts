import { attach, createEvent, sample } from 'effector';

import { $requestProfiles, $selectedRequestProfile, profileUpdated } from '#entities/request-profile/model';
import { RequestHeader } from '#entities/request-profile/types';
import { formatHeaderValue } from '#shared/utils/formatHeaderValue';
import { generateId } from '#shared/utils/generateId';

import { NEW_ROW } from './constant';

type SelectedProfileRequestHeadersPasted = {
  id: RequestHeader['id'];
  value: string;
  field: 'name' | 'value';
};

export const selectedProfileRequestHeadersPasted = createEvent<SelectedProfileRequestHeadersPasted>();

const selectedProfileRequestHeadersPastedFx = attach({
  source: { profiles: $requestProfiles, selectedProfile: $selectedRequestProfile },
  effect: ({ profiles, selectedProfile }, updatedHeader: SelectedProfileRequestHeadersPasted) => {
    const profile = profiles.find(p => p.id === selectedProfile);

    const [targetValue, ...additionalValues] = updatedHeader.value.split(NEW_ROW).filter(Boolean);

    return {
      id: selectedProfile,
      name: profile?.name || '',
      requestHeaders: [
        ...(profile?.requestHeaders.map(header => {
          const isUpdatedHeader = updatedHeader.id === header.id;

          if (isUpdatedHeader) {
            const { name, value } = formatHeaderValue({ pastedValue: targetValue, header });

            return {
              ...header,
              name,
              value,
            };
          }

          return header;
        }) ?? []),
        ...(additionalValues.map(pastedValue => {
          const { name, value } = formatHeaderValue({ pastedValue });
          return {
            id: generateId(),
            name,
            value,
            disabled: false,
          };
        }) ?? []),
      ],
    };
  },
});

sample({ clock: selectedProfileRequestHeadersPasted, target: selectedProfileRequestHeadersPastedFx });
sample({ clock: selectedProfileRequestHeadersPastedFx.doneData, target: profileUpdated });
