import { Box, Stack, TextField } from '@mui/material';
import { ChangeEvent, useCallback, useState } from 'react';

import { Profile } from '#entities/request-profile/types';

import { CheckedHeaderList } from './CheckedProfileList';
import { CopyButton, DownloadButton } from './styled';

type Props = {
  profiles: Profile[];
  selectedProfile: string;
};

export function ExportModalBody({ profiles, selectedProfile }: Props) {
  const [checkedProfiles, setCheckedProfiles] = useState<string[]>(() => [selectedProfile]);
  const [currentProfiles, setCurrentProfiles] = useState<string>(() =>
    JSON.stringify(profiles.filter(({ id }) => id === selectedProfile)),
  );

  const handleChecked = useCallback(
    (list: string[]) => {
      setCheckedProfiles(list);
      setCurrentProfiles(JSON.stringify(profiles.filter(({ id }) => list.includes(id))));
    },
    [profiles],
  );

  const handleDownload = useCallback(() => {
    const blob = new Blob([currentProfiles], { type: 'application/json' });

    const a = document.createElement('a');
    a.href = window.URL.createObjectURL(blob);
    a.download = 'data.json';
    a.click();
    window.URL.revokeObjectURL(a.href);
  }, [currentProfiles]);

  const handleChangedCurrentProfiles = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => {
      setCurrentProfiles(event.target.value);
    },
    [setCurrentProfiles],
  );

  const copyToClipboard = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(currentProfiles).catch(error => {
        console.error('Ошибка при копировании в буфер обмена:', error);
      });
    } else {
      console.error('Clipboard API не поддерживается в вашем браузере.');
    }
  };

  return (
    <>
      <Box>
        <CheckedHeaderList checkedList={checkedProfiles} onChangeCheckedList={handleChecked} />
        <Box mb={3}>
          <TextField
            label='JSON'
            value={currentProfiles}
            onChange={handleChangedCurrentProfiles}
            fullWidth
            multiline
            rows={4}
          />
        </Box>
      </Box>
      <Stack direction='row' justifyContent='flex-end' alignItems='center' spacing={2}>
        <DownloadButton onClick={handleDownload}>Download JSON</DownloadButton>
        <CopyButton variant='contained' onClick={copyToClipboard}>
          Copy
        </CopyButton>
      </Stack>
    </>
  );
}
