import { Typography } from '@mui/material';

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

  return (
    <S.Circle isSelected={isSelected} onClick={handleClick} bgColor={profileColorList[index % profileColorList.length]}>
      <Typography color='white' variant='subtitle1' alignItems={'center'}>
        {profileNameAbbreviation.length === 0 ? index + 1 : profileNameAbbreviation}
      </Typography>
    </S.Circle>
  );
}
