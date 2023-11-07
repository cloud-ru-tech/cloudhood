import { Add, DeleteOutline, MoreVert } from '@mui/icons-material';
import { IconButton, MenuItem, Typography } from '@mui/material';
import { grey } from '@mui/material/colors';
import { useUnit } from 'effector-react';
import { useState } from 'react';

import { exportModalOpened, importModalOpened } from '#entities/modal/model';
import { $selectedProfileIndex } from '#entities/request-profile/model';
import { profileAdded } from '#entities/request-profile/model/request-profiles';
import { selectedProfileRemoved } from '#features/selected-profile/remove/model';
import { profileColorList } from '#shared/assets/colors';
import { FileDownload, FileUpload } from '#shared/assets/svg';

import { CopyActiveRequestHeaders } from './components/CopyActiveRequestHeaders';
import { PauseAllRequestHeaders } from './components/PauseAllRequestHeaders';
import { ProfileNameField } from './components/ProfileNameField';
import * as S from './styled';

export function Header() {
  const [selectedProfileIndex] = useUnit([$selectedProfileIndex]);
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

  const handleOpenImportModal = () => {
    importModalOpened();
    handleClose();
  };

  const handleRemoveProfile = () => {
    selectedProfileRemoved();
    handleClose();
  };

  const handleexportModalOpened = () => {
    exportModalOpened();
    handleClose();
  };

  return (
    <>
      <S.Wrapper bgColor={profileColorList[selectedProfileIndex % profileColorList.length]}>
        <ProfileNameField key={selectedProfileIndex} />
        <S.Actions>
          <CopyActiveRequestHeaders />
          <PauseAllRequestHeaders />
          <IconButton sx={{ color: grey[100] }} size='small' onClick={handleOpen}>
            <MoreVert />
          </IconButton>
        </S.Actions>
      </S.Wrapper>
      <S.StyledMenu anchorEl={anchorEl} open={isMenuOpen} onClose={handleClose}>
        <MenuItem key={'add'} onClick={handleAddProfile}>
          <Typography variant='body2'>Add profile</Typography>
          <Add />
        </MenuItem>
        <MenuItem key={'import'} onClick={handleOpenImportModal}>
          <Typography variant='body2'>Import profile</Typography>
          <FileDownload />
        </MenuItem>
        <MenuItem key={'export'} onClick={handleexportModalOpened}>
          <Typography variant='body2'>Export/share profile</Typography>
          <FileUpload />
        </MenuItem>
        <MenuItem key={'remove'} onClick={handleRemoveProfile}>
          <Typography variant='body2'>Delete profile</Typography>
          <DeleteOutline />
        </MenuItem>
      </S.StyledMenu>
    </>
  );
}
