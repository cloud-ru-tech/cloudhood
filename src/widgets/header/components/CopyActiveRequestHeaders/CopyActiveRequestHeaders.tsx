import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { ButtonTonal } from '@snack-uikit/button';
import { useUnit } from 'effector-react';

import { copyActiveProfileRequestHeaders } from '#features/copy-active-request-headers/model';

export function CopyActiveRequestHeaders() {
  const [handleCopyRequestHeaders] = useUnit([copyActiveProfileRequestHeaders]);

  return <ButtonTonal appearance='neutral' size='m' icon={<ContentCopyIcon />} onClick={handleCopyRequestHeaders} />;
}
