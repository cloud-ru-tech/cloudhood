import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { IconButton } from '@mui/material';
import { grey } from '@mui/material/colors';
import { useUnit } from 'effector-react';

import { copyActiveProfileRequestHeaders } from '#features/copy-active-request-headers/model';

export function CopyActiveRequestHeaders() {
  const [handleCopyRequestHeaders] = useUnit([copyActiveProfileRequestHeaders]);
  return (
    <IconButton sx={{ color: grey[100] }} onClick={handleCopyRequestHeaders}>
      <ContentCopyIcon />
    </IconButton>
  );
}
