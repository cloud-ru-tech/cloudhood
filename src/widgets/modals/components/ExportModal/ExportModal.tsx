import Backdrop from '@mui/material/Backdrop';
import Fade from '@mui/material/Fade';
import Modal from '@mui/material/Modal';
import Typography from '@mui/material/Typography';

import { exportModalClosed } from '#entities/modal/model';

import { ExportModalBody } from './component';
import * as S from './styled';

export function ExportModal() {
  const handleClose = () => exportModalClosed();

  return (
    <>
      <Modal
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
            <ExportModalBody />
          </S.Wrapper>
        </Fade>
      </Modal>
    </>
  );
}
