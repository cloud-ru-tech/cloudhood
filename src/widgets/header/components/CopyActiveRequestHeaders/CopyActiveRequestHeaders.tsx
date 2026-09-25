import { useUnit } from 'effector-react';

import { Button } from '@cloud-ru/ds-button';
import { CopySVG } from '@cloud-ru/ds-icons/interface/system';

import { copyActiveProfileRequestHeaders } from '#features/copy-active-request-headers/model';

export function CopyActiveRequestHeaders() {
  const [handleCopyRequestHeaders] = useUnit([copyActiveProfileRequestHeaders]);

  return <Button view='function' appearance='neutral' size='l' icon={<CopySVG />} onClick={handleCopyRequestHeaders} />;
}
