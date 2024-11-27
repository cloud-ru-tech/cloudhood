import { attach, createEvent, sample } from 'effector';

import { $requestProfiles, $selectedRequestProfile, profileUpdated } from '#entities/request-profile/model';
import { RequestHeader } from '#entities/request-profile/types';
import { generateId } from '#shared/utils/generateId';

import { DELIMITER, NEW_ROW } from '../paste/constant';

type SelectedProfileRequestHeadersPasted = {
  id: RequestHeader['id'];
  value: string;
  field: 'name' | 'value';
};

type ProcessValue = {
  pastedValue: string;
  header?: RequestHeader;
};

const formatValue = ({ pastedValue, header }: ProcessValue): { name: string; value: string } => {
  const [name, value] = pastedValue.split(DELIMITER).map(element => element.trim());

  return {
    name: name.length ? name : header?.name || '',
    value: value.length ? value : header?.value || '',
  };
};

export const selectedProfileRequestHeadersPastedMultiple = createEvent<SelectedProfileRequestHeadersPasted>();

const selectedProfileRequestHeadersPastedMultipleFx = attach({
  source: { profiles: $requestProfiles, selectedProfile: $selectedRequestProfile },
  effect: ({ profiles, selectedProfile }, updatedHeader: SelectedProfileRequestHeadersPasted) => {
    const profile = profiles.find(p => p.id === selectedProfile);

    const [targetValue, ...additionalValues] = updatedHeader.value.split(NEW_ROW).filter(Boolean);

    return {
      id: selectedProfile,
      ...(Boolean(profile?.name) && { name: profile?.name }),
      requestHeaders: [
        ...(profile?.requestHeaders.map(header => {
          const isUpdatedHeader = updatedHeader.id === header.id;

          if (isUpdatedHeader) {
            const { name, value } = formatValue({ pastedValue: targetValue, header });

            return {
              ...header,
              id: updatedHeader.id,
              name,
              value,
            };
          }

          return header;
        }) ?? []),
        ...(additionalValues.map(pastedValue => {
          const { name, value } = formatValue({ pastedValue });
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

sample({ clock: selectedProfileRequestHeadersPastedMultiple, target: selectedProfileRequestHeadersPastedMultipleFx });
sample({ clock: selectedProfileRequestHeadersPastedMultipleFx.doneData, target: profileUpdated });
