import { Typography } from '@mui/material';
import { setSelectedRequestProfileName } from '#entities/request-profile/model';
import * as S from './styled';

type SetRequestProfileProps = {
  profile: string;
  index: string;
  isSelected: boolean;
};

export function SetRequestProfile({ profile, index, isSelected }: SetRequestProfileProps) {
  const handleClick = () => setSelectedRequestProfileName(profile);

  return (
    <S.Circle isSelected={isSelected} onClick={handleClick}>
      <Typography color={'white'} variant='body2' alignItems={'center'}>
        {index}
      </Typography>
    </S.Circle>
  );
}
