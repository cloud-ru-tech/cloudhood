import { createEvent, sample } from 'effector';

import { $selectedRequestProfile, profileRemoved } from '#entities/request-profile/model';

export const selectedProfileRemoved = createEvent();

sample({ clock: selectedProfileRemoved, source: $selectedRequestProfile, target: profileRemoved });
