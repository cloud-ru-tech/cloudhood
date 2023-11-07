import { Grid, Typography } from '@mui/material';
import { useUnit } from 'effector-react';
import { KeyboardEvent, useRef, useState } from 'react';

import { $selectedProfile, $selectedProfileIndex } from '#entities/request-profile/model';
import { setSelectedRequestProfileName } from '#features/selected-profile-update-name/model';

import { EditIcon, TextField } from './styled';

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

  return (
    <Grid container>
      <Grid item xs={5}>
        {isEdited ? (
          <TextField
            inputRef={ref}
            placeholder='Profile name'
            variant='standard'
            defaultValue={profile?.name !== undefined ? profile?.name : `Profile ${profileIndex + 1}`}
            onKeyUp={handleKeyUp}
          />
        ) : (
          <Typography color='white' variant='h6'>
            {profile?.name || `Profile ${profileIndex + 1}`}
          </Typography>
        )}
      </Grid>
      <Grid item xs={2}>
        <EditIcon onClick={toggleEdit} />
      </Grid>
    </Grid>
  );
}
