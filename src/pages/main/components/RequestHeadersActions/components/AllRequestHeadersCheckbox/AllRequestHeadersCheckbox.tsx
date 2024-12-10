import { useUnit } from 'effector-react';

import { Checkbox } from '@snack-uikit/toggles';

import { $isAllEnabled, toggleAllProfileRequestHeaders } from '#features/toggle-all-request-headers/model';

export function AllRequestHeadersCheckbox() {
  const isAllEnabled = useUnit($isAllEnabled);

  return <Checkbox checked={isAllEnabled} onChange={toggleAllProfileRequestHeaders} />;
}
