import { ControlPointDuplicateOutlined, Delete, MoreVert } from '@mui/icons-material';
import { IconButton, Menu, MenuItem, Typography } from '@mui/material';
import { grey } from '@mui/material/colors';
import { useState } from 'react';

import { addProfile, removeSelectedProfile } from '#entities/request-profile/model';
import { PauseAllRequestHeaders } from '#features/pause-all-request-headers/PauseAllRequestHeaders';
import { Logo } from '#shared/components/Logo';

import * as S from './styled';
export function Header() {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const isMenuOpen = Boolean(anchorEl);

  const handleOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleAddProfile = () => {
    addProfile();
    handleClose();
  };

  const handleRemoveProfile = () => {
    removeSelectedProfile();
    handleClose();
  };

  return (
    <>
      <S.Wrapper>
        <Logo />
        <S.Actions>
          <PauseAllRequestHeaders />
          <IconButton sx={{ color: grey[100] }} size='small' onClick={handleOpen}>
            <MoreVert />
          </IconButton>
        </S.Actions>
      </S.Wrapper>
      <Menu anchorEl={anchorEl} open={isMenuOpen} onClose={handleClose}>
        <MenuItem onClick={handleAddProfile}>
          <Typography variant='body2'>Add profile</Typography>
          <ControlPointDuplicateOutlined />
        </MenuItem>
        <MenuItem onClick={handleRemoveProfile}>
          <Typography variant='body2'>Delete profile</Typography>
          <Delete />
        </MenuItem>
      </Menu>
    </>
  );
}
