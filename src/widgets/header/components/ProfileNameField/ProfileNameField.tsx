import { Grid, Tooltip, TooltipProps } from '@mui/material';
import { useUnit } from 'effector-react';
import { KeyboardEvent, useMemo, useRef, useState } from 'react';

import { $selectedProfile, $selectedProfileIndex } from '#entities/request-profile/model';
import { setSelectedRequestProfileName } from '#features/selected-profile-update-name/model';

import { EditIcon, TextField, Typography } from './styled';

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
  const ref = useRef<HTMLInputElement>(null);

  const toggleEdit = () => {
    setIsEdited(prev => !prev);
    if (ref.current && isEdited) onChangeProfileName(ref.current?.value);
  };

  const handleKeyUp = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      toggleEdit();
    }
  };

  const profileName = useMemo(
    () => (profile?.name !== undefined ? profile.name : `Profile ${profileIndex + 1}`),
    [profile, profileIndex],
  );

  return (
    <Grid container alignItems='center' xs={6} spacing={2} wrap='nowrap'>
      <Grid item xs={8}>
        {isEdited ? (
          <TextField
            inputRef={ref}
            placeholder='Profile name'
            variant='standard'
            defaultValue={profileName}
            onKeyUp={handleKeyUp}
            onBlur={toggleEdit}
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
        <EditIcon onClick={toggleEdit} />
      </Grid>
    </Grid>
  );
}
