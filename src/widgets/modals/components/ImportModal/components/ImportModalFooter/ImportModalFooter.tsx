import { Stack } from '@mui/material';
import { useUnit } from 'effector-react';
import { ChangeEvent, useCallback, useRef } from 'react';

import { profileImported, profileImportLoadedFile } from '#features/import-profile/model';
import { SendArrowOutline } from '#shared/assets/svg';

import * as S from './styled';

export function ImportModalFooter() {
  const [handleProfileImported] = useUnit([profileImported]);

  const loadFileRef = useRef<HTMLInputElement>(null);

  const handleProfileLoaded = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const currentFile = e.target.files?.[0];
    const fileStorage = loadFileRef.current;

    if (fileStorage) {
      fileStorage.value = '';
    }

    if (currentFile) {
      profileImportLoadedFile(currentFile);
    }
  }, []);

  return (
    <Stack direction='row' justifyContent='flex-end' alignItems='center' columnGap='8px'>
      <S.LoadButton component='label' startIcon={<SendArrowOutline />}>
        LOAD FILE
        <S.VisuallyHiddenInput
          ref={loadFileRef}
          type='file'
          accept='.json,application/json'
          onChange={handleProfileLoaded}
        />
      </S.LoadButton>
      <S.ImportButton variant='contained' onClick={handleProfileImported}>
        IMPORT
      </S.ImportButton>
    </Stack>
  );
}
