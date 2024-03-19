import DoneIcon from '@mui/icons-material/Done';
import EditIcon from '@mui/icons-material/Edit';
import { Grid, Tooltip, TooltipProps } from '@mui/material';
import { useUnit } from 'effector-react';
import { FocusEvent, KeyboardEvent, useRef, useState } from 'react';

import { $selectedProfile, $selectedProfileIndex } from '#entities/request-profile/model';
import { setSelectedRequestProfileName } from '#features/selected-profile-update-name/model';

import { IconButton, TextField, Typography } from './styled';

const tooltipProps: TooltipProps['slotProps'] = {
  popper: {
    modifiers: [
      {
        name: 'offset',
        options: {
          offset: [0, -5],
        },
      },
    ],
  },
};

export function ProfileNameField() {
  const [isEdited, setIsEdited] = useState<boolean>(false);
  const [profile, profileIndex, onChangeProfileName] = useUnit([
    $selectedProfile,
    $selectedProfileIndex,
    setSelectedRequestProfileName,
  ]);
  const inputRef = useRef<HTMLInputElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const toggleEdit = () => {
    setIsEdited(prev => !prev);
    if (inputRef.current && isEdited) onChangeProfileName(inputRef.current?.value);
  };

  const handleKeyUp = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      toggleEdit();
    }
  };

  const handleBlur = ({ relatedTarget }: FocusEvent) => {
    if (relatedTarget === buttonRef.current) return;
    toggleEdit();
  };

  const profileName = profile?.name !== undefined ? profile.name : `Profile ${profileIndex + 1}`;

  return (
    <Grid container alignItems='center' width='50%' spacing={2} wrap='nowrap'>
      <Grid item xs={8}>
        {isEdited ? (
          <TextField
            inputRef={inputRef}
            placeholder='Profile name'
            variant='standard'
            defaultValue={profileName}
            onKeyUp={handleKeyUp}
            onBlur={handleBlur}
            autoFocus
          />
        ) : (
          <Tooltip title={profileName} arrow placement='bottom-start' slotProps={tooltipProps}>
            <Typography color='white' variant='h6'>
              {profileName}
            </Typography>
          </Tooltip>
        )}
      </Grid>
      <Grid item xs={4}>
        <IconButton ref={buttonRef} onClick={toggleEdit}>
          {isEdited ? <DoneIcon /> : <EditIcon />}
        </IconButton>
      </Grid>
    </Grid>
  );
}
