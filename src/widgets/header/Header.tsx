import { ArrowDownward, ControlPointDuplicateOutlined, Delete, MoreVert } from '@mui/icons-material';
import { IconButton, MenuItem, Typography } from '@mui/material';
import { grey } from '@mui/material/colors';
import { useState } from 'react';

import { openExportModal } from '#entities/modal/model';
import { profileAdded } from '#entities/request-profile/model/request-profiles';
import { selectedProfileRemoved } from '#features/selected-profile/remove/model';
import { Logo } from '#shared/components/Logo';

import { PauseAllRequestHeaders } from './components/PauseAllRequestHeaders';
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
    profileAdded();
    handleClose();
  };

  const handleRemoveProfile = () => {
    selectedProfileRemoved();
    handleClose();
  };

  const handleOpenExportModal = () => {
    openExportModal();
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
      <S.StyledMenu anchorEl={anchorEl} open={isMenuOpen} onClose={handleClose}>
        <MenuItem key={'add'} onClick={handleAddProfile}>
          <Typography variant='body2' my={1}>
            Add profile
          </Typography>
          <ControlPointDuplicateOutlined />
        </MenuItem>
        <MenuItem key={'remove'} onClick={handleRemoveProfile}>
          <Typography variant='body2' my={1}>
            Delete profile
          </Typography>
          <Delete />
        </MenuItem>
        <MenuItem key={'export'} onClick={handleOpenExportModal}>
          <Typography variant='body2' my={1}>
            Export/share profile
          </Typography>
          <ArrowDownward />
        </MenuItem>
      </S.StyledMenu>
    </>
  );
}
