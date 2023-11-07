import { Typography } from '@mui/material';

import { selectedRequestProfileIdChanged } from '#entities/request-profile/model';
import { profileColorList } from '#shared/assets/colors';

import * as S from './styled';

type SetRequestProfileProps = {
  profile: string;
  index: number;
  isSelected: boolean;
};

export function SetRequestProfile({ profile: profileId, index, isSelected }: SetRequestProfileProps) {
  const handleClick = () => selectedRequestProfileIdChanged(profileId);

  return (
    <S.Circle isSelected={isSelected} onClick={handleClick} bgColor={profileColorList[index % profileColorList.length]}>
      <Typography color={'white'} variant='body2' alignItems={'center'}>
        {index + 1}
      </Typography>
    </S.Circle>
  );
}
