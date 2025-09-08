import { Tooltip } from '@snack-uikit/tooltip';

import { selectedRequestProfileIdChanged } from '#entities/request-profile/model';
import { profileColorList } from '#shared/assets/colors';
import { getProfileNameAbbreviation } from '#widgets/sidebar/helpers/sidebar';

import * as S from './styled';

type SetRequestProfileProps = {
  profileId: string;
  index: number;
  isSelected: boolean;
  profileName: string;
};

export function SetRequestProfile({ profileId, index, isSelected, profileName }: SetRequestProfileProps) {
  const handleClick = () => selectedRequestProfileIdChanged(profileId);
  const color = profileColorList[index % profileColorList.length];
  const profileNameAbbreviation = getProfileNameAbbreviation(profileName);

  return (
    <S.Circle
      data-selected={isSelected || undefined}
      onClick={handleClick}
      color={color.font}
      backgroundColor={color.background}
      data-test-id='profile-select'
    >
      <Tooltip tip={profileName} placement='right' {...(profileName ? {} : { open: false })}>
        {profileNameAbbreviation.length === 0 ? index + 1 : profileNameAbbreviation}
      </Tooltip>
    </S.Circle>
  );
}
