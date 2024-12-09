import { Close } from '@mui/icons-material';
import { Autocomplete, Box, Chip, Stack, TextField, Typography } from '@mui/material';
import { useUnit } from 'effector-react';
import { ChangeEvent, useCallback } from 'react';

import { exportModalClosed } from '#entities/modal/model';
import {
  $profileExportString,
  $profilesNameOptions,
  $selectedExportProfileValue,
  OptionProfileExport,
  profileExportStringChanged,
  profileNameExportChanged,
} from '#features/export-profile';

import { IconButton } from './styled';

export function ExportModalBody() {
  const [profileExportString, profilesNameOptions, selectedExportProfileValue, handleExportModalClosed] = useUnit([
    $profileExportString,
    $profilesNameOptions,
    $selectedExportProfileValue,
    exportModalClosed,
  ]);

  const handleChangedCurrentProfiles = useCallback((event: ChangeEvent<HTMLTextAreaElement>) => {
    profileExportStringChanged(event.target.value);
  }, []);

  const handleChange = useCallback((_: unknown, value: OptionProfileExport[]) => profileNameExportChanged(value), []);

  return (
    <Stack direction='column' rowGap='24px' padding='8px 14px 8px 0'>
      <Stack direction='row' justifyContent='space-between'>
        <Stack direction='row' alignItems='center' columnGap='4px'>
          <Typography variant='h6' component='h2'>
            Export profile
          </Typography>
        </Stack>
        <IconButton onClick={handleExportModalClosed}>
          <Close />
        </IconButton>
      </Stack>
      <>
        <Box>
          <Autocomplete
            fullWidth
            multiple
            value={selectedExportProfileValue}
            size='small'
            limitTags={3}
            disableClearable
            options={profilesNameOptions}
            getOptionLabel={(option: OptionProfileExport) => option.name}
            getOptionDisabled={(option: OptionProfileExport) =>
              selectedExportProfileValue.length === 1 && selectedExportProfileValue[0].id === option.id
            }
            renderTags={(tagValue, getTagProps) =>
              tagValue.map((option: OptionProfileExport, index) => {
                const { onDelete, ...props } = getTagProps({ index });
                return (
                  <Chip label={option.name} {...props} {...(tagValue.length !== 1 && { onDelete })} key={option.id} />
                );
              })
            }
            renderInput={params => <TextField {...params} label='Profiles' />}
            onChange={handleChange}
          />
        </Box>
        <Box>
          <TextField
            label='JSON'
            value={profileExportString}
            onChange={handleChangedCurrentProfiles}
            fullWidth
            multiline
            rows={4}
          />
        </Box>
      </>
    </Stack>
  );
}
