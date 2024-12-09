import { Close } from '@mui/icons-material';
import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useUnit } from 'effector-react';
import { ChangeEvent, useCallback, useEffect, useMemo, useRef } from 'react';

import { importFromExtensionModalClosed } from '#entities/modal/model';
import {
  $profileImportExtensionName,
  profileImportExtensionNameChanged,
} from '#features/import-profile/extensions/model';
import {
  $profileImportErrorInfo,
  $profileImportString,
  profileImportStringChanged,
} from '#features/import-profile/model';
import { Extensions } from '#shared/constants';

import * as S from './styled';

export function ImportFromExtensionModalBody() {
  const [
    profileImportExtensionName,
    profileImportString,
    { errorMessage, errorPosition, isError },
    handleImportFromExtensionModalClosed,
  ] = useUnit([
    $profileImportExtensionName,
    $profileImportString,
    $profileImportErrorInfo,
    importFromExtensionModalClosed,
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

  const handleChange = useCallback((ev: SelectChangeEvent) => profileImportExtensionNameChanged(ev.target.value), []);

  function handleProfileImportStringChanged(e: ChangeEvent<HTMLTextAreaElement>) {
    profileImportStringChanged(e.target.value);
  }

  const menuItems = useMemo(
    () =>
      Object.entries(Extensions).map(([key, value]) => (
        <MenuItem key={value} value={value}>
          {key}
        </MenuItem>
      )),
    [],
  );

  return (
    <Stack direction='column' rowGap='24px' padding='8px 14px 8px 0'>
      <Stack direction='row' justifyContent='space-between'>
        <Stack direction='row' alignItems='center' columnGap='4px'>
          <Typography variant='h6' component='h2'>
            Import from other extension
          </Typography>
        </Stack>
        <S.IconButton onClick={handleImportFromExtensionModalClosed}>
          <Close />
        </S.IconButton>
      </Stack>
      <Box>
        <FormControl fullWidth>
          <InputLabel id='import-extension'>Other extension</InputLabel>
          <Select
            labelId='import-extension'
            value={profileImportExtensionName ?? undefined}
            label='Other extension'
            fullWidth
            onChange={handleChange}
          >
            {menuItems}
          </Select>
        </FormControl>
      </Box>
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
            errorMessage ? (
              <S.HelperText component='span' variant='body2'>
                {errorMessage}
              </S.HelperText>
            ) : undefined
          }
        />
      </Box>
    </Stack>
  );
}
