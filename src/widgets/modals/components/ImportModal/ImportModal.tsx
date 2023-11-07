import Backdrop from '@mui/material/Backdrop';
import Fade from '@mui/material/Fade';
import Modal from '@mui/material/Modal';
import { useUnit } from 'effector-react';

import { importModalClosed } from '#entities/modal/model';

import { ImportModalBody } from './components/ImportModalBody';
import { ImportModalFooter } from './components/ImportModalFooter';
import * as S from './styled';

export function ImportModal() {
  const [handleImportModalClosed] = useUnit([importModalClosed]);

  return (
    <Modal
      open={true}
      onClose={handleImportModalClosed}
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
          <ImportModalBody />
          <ImportModalFooter />
        </S.Wrapper>
      </Fade>
    </Modal>
  );
}
