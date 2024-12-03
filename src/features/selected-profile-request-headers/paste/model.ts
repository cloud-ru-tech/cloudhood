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

    const pasteValues: string[] = updatedHeader.value.split(NEW_ROW).filter(Boolean);

    let indexAfterTarget: number;

    return {
      id: selectedProfile,
      name: profile?.name || '',

      requestHeaders: [
        ...(profile?.requestHeaders.reduce((acc, header, index) => {
          const isUpdatedHeader = updatedHeader.id === header.id;

          if (isUpdatedHeader && pasteValues.length) {
            const { name, value } = formatHeaderValue({ pastedValue: pasteValues.shift() as string, header });

            indexAfterTarget = index;

            return [
              ...acc,
              {
                ...header,
                name,
                value,
              },
            ];
          }

          if (index > indexAfterTarget && !header.name && !header.value && pasteValues.length) {
            const { name, value } = formatHeaderValue({ pastedValue: pasteValues.shift() as string, header });
            return [
              ...acc,
              {
                ...header,
                name,
                value,
              },
            ];
          }

          return [...acc, header];
        }, [] as RequestHeader[]) || []),
        ...(pasteValues.map(pastedValue => {
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
