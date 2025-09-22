import { useUnit } from 'effector-react';
import { FocusEvent, KeyboardEvent, useEffect, useRef, useState } from 'react';

import { ButtonFunction } from '@snack-uikit/button';
import { FieldText } from '@snack-uikit/fields';
import { CheckSVG } from '@snack-uikit/icons';

import { $selectedProfile, $selectedProfileIndex } from '#entities/request-profile/model';
import { setSelectedRequestProfileName } from '#features/selected-profile-update-name/model';
import { EditSVG } from '#shared/assets/svg';

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

  const profileName = profile?.name !== undefined ? profile.name : `Profile ${profileIndex + 1}`;

  const [value, setValue] = useState(profileName);

  const toggleEdit = () => {
    setIsEdited(prev => !prev);

    if (isEdited) {
      onChangeProfileName(value);
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      toggleEdit();
    }
  };

  const handleBlur = ({ relatedTarget }: FocusEvent) => {
    if (relatedTarget === buttonRef.current) {
      return;
    }

    toggleEdit();
  };

  useEffect(() => {
    if (isEdited) {
      inputRef.current?.focus();
    }
  }, [isEdited]);

  return (
    <S.Row>
      <S.TitleWrapper>
        {isEdited ? (
          <FieldText
            size='m'
            ref={inputRef}
            placeholder='Profile name'
            value={value}
            onChange={setValue}
            onKeyDown={onKeyDown}
            onBlur={handleBlur}
            showClearButton={false}
          />
        ) : (
          <S.Title text={profileName} maxLines={1} />
        )}
      </S.TitleWrapper>

      <S.ButtonWrapper>
        <ButtonFunction
          appearance='neutral'
          size='m'
          ref={buttonRef}
          onClick={toggleEdit}
          icon={isEdited ? <CheckSVG /> : <EditSVG />}
        />
      </S.ButtonWrapper>
    </S.Row>
  );
}
