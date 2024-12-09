import { Stack } from '@mui/material';
import { useUnit } from 'effector-react';

import { profileExportDownloaded, profileExportSaved } from '#features/export-profile';

import * as S from './styled';

export function ExportModalFooter() {
  const [downloadHandler, copyToClipboard] = useUnit([profileExportDownloaded, profileExportSaved]);

  return (
    <Stack direction='row' justifyContent='flex-end' alignItems='center' columnGap='8px'>
      <S.DownloadButton onClick={downloadHandler}>Download JSON</S.DownloadButton>
      <S.CopyButton variant='contained' onClick={copyToClipboard}>
        Copy
      </S.CopyButton>
    </Stack>
  );
}
