import { attach, createEvent, sample } from 'effector';

import { $requestProfiles, $selectedRequestProfile, profileUpdated } from '#entities/request-profile/model';
import { RequestHeader } from '#entities/request-profile/types';

import { DELIMITER } from './constant';

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
    return {
      id: selectedProfile,
      ...(Boolean(profile?.name) && { name: profile?.name }),
      requestHeaders:
        profile?.requestHeaders.map(header => {
          const isUpdatedHeader = updatedHeader.id === header.id;

          if (isUpdatedHeader) {
            const transformNameValue = updatedHeader.value.split(DELIMITER).map(element => element.trim());
            const allElementsHaveCharacters = transformNameValue.every(element => element.length > 0);

            const name = allElementsHaveCharacters ? transformNameValue[0] : header.name;
            const value = allElementsHaveCharacters ? transformNameValue[1] : header.value;

            return {
              ...header,
              id: updatedHeader.id,
              name,
              value,
            };
          }

          return header;
        }) ?? [],
    };
  },
});

sample({ clock: selectedProfileRequestHeadersPasted, target: selectedProfileRequestHeadersPastedFx });
sample({ clock: selectedProfileRequestHeadersPastedFx.doneData, target: profileUpdated });
