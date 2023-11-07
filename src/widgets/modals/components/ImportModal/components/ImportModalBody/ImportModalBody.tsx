import { Close, HelpOutline } from '@mui/icons-material';
import { Box, Stack, TextField, Tooltip, Typography } from '@mui/material';
import { useUnit } from 'effector-react';
import { ChangeEvent, useEffect, useRef } from 'react';

import { importModalClosed } from '#entities/modal/model';
import {
  $profileImportErrorInfo,
  $profileImportString,
  profileImportStringChanged,
} from '#features/import-profile/model';

import { TOOLTIP_TITLE } from './constants';
import * as S from './styled';

export function ImportModalBody() {
  const [profileImportString, { errorMessage, errorPosition, isError }, handleImportModalClosed] = useUnit([
    $profileImportString,
    $profileImportErrorInfo,
    importModalClosed,
  ]);

  const textFieldRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isError && textFieldRef.current) {
      textFieldRef.current.focus();

      if (errorPosition) {
        textFieldRef.current.setSelectionRange(errorPosition, errorPosition);
      }
    }
  }, [errorPosition, isError]);

  function handleProfileImportStringChanged(e: ChangeEvent<HTMLTextAreaElement>) {
    profileImportStringChanged(e.target.value);
  }

  return (
    <Stack direction='column' rowGap='24px' padding='8px 14px 8px 0'>
      <Stack direction='row' justifyContent='space-between'>
        <Stack direction='row' alignItems='center' columnGap='4px'>
          <Typography variant='h6' component='h2'>
            Import profile
          </Typography>
          <Tooltip
            title={
              <Typography variant='body1' component='pre'>
                {TOOLTIP_TITLE}
              </Typography>
            }
            placement='right'
          >
            <HelpOutline />
          </Tooltip>
        </Stack>
        <S.IconButton onClick={handleImportModalClosed}>
          <Close />
        </S.IconButton>
      </Stack>
      <Box>
        <TextField
          inputRef={textFieldRef}
          label='JSON'
          value={profileImportString}
          onChange={handleProfileImportStringChanged}
          fullWidth
          multiline
          rows={4}
          error={isError}
          helperText={
            <S.HelperText component='span' variant='body2'>
              {errorMessage}
            </S.HelperText>
          }
        />
      </Box>
    </Stack>
  );
}
