import DoneIcon from '@mui/icons-material/Done';
import EditIcon from '@mui/icons-material/Edit';
import { Grid } from '@mui/material';
import { ButtonTonal } from '@snack-uikit/button';
import { useUnit } from 'effector-react';
import { FocusEvent, KeyboardEvent, useRef, useState } from 'react';

import { $selectedProfile, $selectedProfileIndex } from '#entities/request-profile/model';
import { setSelectedRequestProfileName } from '#features/selected-profile-update-name/model';

import * as S from './styled';

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
          <S.TextField
            inputRef={inputRef}
            placeholder='Profile name'
            variant='standard'
            defaultValue={profileName}
            onKeyUp={handleKeyUp}
            onBlur={handleBlur}
            autoFocus
          />
        ) : (
          <S.Title text={profileName} />
        )}
      </Grid>
      <Grid item xs={4}>
        <ButtonTonal
          appearance='neutral'
          size='m'
          ref={buttonRef}
          onClick={toggleEdit}
          icon={isEdited ? <DoneIcon /> : <EditIcon />}
        />
      </Grid>
    </Grid>
  );
}
