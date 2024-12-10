import { selectedRequestProfileIdChanged } from '#entities/request-profile/model';
import { profileColorList } from '#shared/assets/colors';

import * as S from './styled';

type SetRequestProfileProps = {
  profileId: string;
  index: number;
  isSelected: boolean;
  profileNameAbbreviation: string;
};

export function SetRequestProfile({ profileId, index, isSelected, profileNameAbbreviation }: SetRequestProfileProps) {
  const handleClick = () => selectedRequestProfileIdChanged(profileId);
  const color = profileColorList[index % profileColorList.length];

  return (
    <S.Circle
      data-selected={isSelected || undefined}
      onClick={handleClick}
      color={color.font}
      backgroundColor={color.background}
    >
      {profileNameAbbreviation.length === 0 ? index + 1 : profileNameAbbreviation}
    </S.Circle>
  );
}
