import { useUnit } from 'effector-react';

import { ButtonFunction } from '@snack-uikit/button';
import { CopySVG } from '@snack-uikit/icons';

import { copyActiveProfileRequestHeaders } from '#features/copy-active-request-headers/model';

export function CopyActiveRequestHeaders() {
  const [handleCopyRequestHeaders] = useUnit([copyActiveProfileRequestHeaders]);

  return <ButtonFunction appearance='neutral' size='m' icon={<CopySVG />} onClick={handleCopyRequestHeaders} />;
}
