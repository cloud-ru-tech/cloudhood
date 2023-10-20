import { Autocomplete, Box, Chip, Stack, TextField } from '@mui/material';
import { useUnit } from 'effector-react';
import { ChangeEvent, useCallback } from 'react';

import {
  $profileExportString,
  $profilesNameOptions,
  $selectedExportProfileValue,
  OptionProfileExport,
  profileExportDownloaded,
  profileExportSaved,
  profileExportStringChanged,
  profileNameExportChanged,
} from '#features/export-profile';

import { CopyButton, DownloadButton } from './styled';

export function ExportModalBody() {
  const [profileExportString, profilesNameOptions, selectedExportProfileValue, downloadHandler, copyToClipboard] =
    useUnit([
      $profileExportString,
      $profilesNameOptions,
      $selectedExportProfileValue,
      profileExportDownloaded,
      profileExportSaved,
    ]);

  const handleChangedCurrentProfiles = useCallback((event: ChangeEvent<HTMLTextAreaElement>) => {
    profileExportStringChanged(event.target.value);
  }, []);

  const handleChange = useCallback((_: unknown, value: OptionProfileExport[]) => profileNameExportChanged(value), []);

  return (
    <>
      <>
        <Box mb={3}>
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
        <Box mb={3}>
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
      <Stack direction='row' justifyContent='flex-end' alignItems='center' spacing={2}>
        <DownloadButton onClick={downloadHandler}>Download JSON</DownloadButton>
        <CopyButton variant='contained' onClick={copyToClipboard}>
          Copy
        </CopyButton>
      </Stack>
    </>
  );
}
