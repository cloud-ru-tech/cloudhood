// import { Grid } from '@mui/material';
import Backdrop from '@mui/material/Backdrop';
// import Button from '@mui/material/Button';
import Fade from '@mui/material/Fade';
import Modal from '@mui/material/Modal';
import Typography from '@mui/material/Typography';
import { useUnit } from 'effector-react';

// import React from 'react';
import { closeExportModal } from '#entities/modal/model';
import { $selectedRequestProfile } from '#entities/request-profile/model';
import { $profiles } from '#widgets/sidebar/model';

import { ExportModalBody } from './component';
import * as S from './styled';

export function ExportModal() {
  const [profiles, selectedProfile] = useUnit([$profiles, $selectedRequestProfile]);

  // React.useEffect(() => {
  //   setCheckedProfiles([selectedProfile]);
  // }, [selectedProfile]);

  const handleClose = () => closeExportModal();

  return (
    <Modal
      aria-labelledby='transition-modal-title'
      aria-describedby='transition-modal-description'
      open={true}
      onClose={handleClose}
      closeAfterTransition
      slots={{ backdrop: Backdrop }}
      slotProps={{
        backdrop: {
          timeout: 500,
        },
      }}
    >
      <Fade in>
        <S.Wrapper>
          <Typography variant='h6' component='h2' mb={3}>
            Export profile
          </Typography>
          {profiles?.length && selectedProfile && (
            <ExportModalBody profiles={profiles} selectedProfile={selectedProfile} />
          )}
        </S.Wrapper>
      </Fade>
    </Modal>
  );
}
