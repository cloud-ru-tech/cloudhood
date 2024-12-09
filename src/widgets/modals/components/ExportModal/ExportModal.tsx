import Backdrop from '@mui/material/Backdrop';
import Fade from '@mui/material/Fade';
import Modal from '@mui/material/Modal';
import { useUnit } from 'effector-react';

import { exportModalClosed } from '#entities/modal/model';

import { ExportModalBody } from './components/ExportModalBody';
import { ExportModalFooter } from './components/ExportModalFooter';
import * as S from './styled';

export function ExportModal() {
  const [handleExportModalClosed] = useUnit([exportModalClosed]);

  return (
    <Modal
      open={true}
      onClose={handleExportModalClosed}
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
          <ExportModalBody />
          <ExportModalFooter />
        </S.Wrapper>
      </Fade>
    </Modal>
  );
}
