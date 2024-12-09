import Backdrop from '@mui/material/Backdrop';
import Fade from '@mui/material/Fade';
import Modal from '@mui/material/Modal';
import { useUnit } from 'effector-react';

import { importFromExtensionModalClosed } from '#entities/modal/model';

import { ImportFromExtensionModalBody } from './components/ImportFromExtensionModalBody';
import { ImportFromExtensionModalFooter } from './components/ImportFromExtensionModalFooter';
import * as S from './styled';

export function ImportFromExtensionModal() {
  const [handleFromExtensionImportModalClosed] = useUnit([importFromExtensionModalClosed]);

  return (
    <Modal
      open={true}
      onClose={handleFromExtensionImportModalClosed}
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
          <ImportFromExtensionModalBody />
          <ImportFromExtensionModalFooter />
        </S.Wrapper>
      </Fade>
    </Modal>
  );
}
