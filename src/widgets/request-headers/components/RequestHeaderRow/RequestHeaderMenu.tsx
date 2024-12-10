import { MoreVert } from '@mui/icons-material';
import ClearIcon from '@mui/icons-material/Clear';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import SwitchAccountIcon from '@mui/icons-material/SwitchAccount';
import { MenuItem, Typography } from '@mui/material';
import { ButtonFunction } from '@snack-uikit/button';
import { useUnit } from 'effector-react';
import { useState } from 'react';

import { RequestHeader } from '#entities/request-profile/types';
import { selectedProfileRequestHeaderCleared } from '#features/selected-profile-request-headers/clear/model';
import { selectedProfileRequestHeaderCopied } from '#features/selected-profile-request-headers/copy/model';
import { selectedProfileRequestHeaderDuplicated } from '#features/selected-profile-request-headers/duplicate/model';

import * as S from './styled';

export function RequestHeaderMenu({ id, name, value }: RequestHeader) {
  const [handleDuplicate, handleRequestHeaderCopy, handleClear] = useUnit([
    selectedProfileRequestHeaderDuplicated,
    selectedProfileRequestHeaderCopied,
    selectedProfileRequestHeaderCleared,
  ]);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const isMenuOpen = Boolean(anchorEl);

  const handleClose = () => {
    setAnchorEl(null);
  };
  const handleOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCopy = () => {
    handleRequestHeaderCopy({ name, value });
    handleClose();
  };

  return (
    <>
      <ButtonFunction size='s' onClick={handleOpen} icon={<MoreVert />} />

      <S.StyledMenu anchorEl={anchorEl} open={isMenuOpen} onClose={handleClose}>
        <MenuItem key={'duplicate-value'} onClick={() => handleDuplicate(id)}>
          <Typography variant='body2'>Duplicate</Typography>
          <SwitchAccountIcon />
        </MenuItem>
        <MenuItem key={'copy-value'} onClick={handleCopy}>
          <Typography variant='body2'>Copy</Typography>
          <ContentCopyIcon />
        </MenuItem>
        <MenuItem key={'clear-value'} onClick={() => handleClear(id)}>
          <Typography variant='body2'>Clear Value</Typography>
          <ClearIcon />
        </MenuItem>
      </S.StyledMenu>
    </>
  );
}
