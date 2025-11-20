import { useUnit } from 'effector-react';
import { useCallback, useEffect, useRef } from 'react';

import { ButtonFilled, ButtonSimple } from '@snack-uikit/button';
import { FileUpload } from '@snack-uikit/drop-zone';
import { FieldTextArea } from '@snack-uikit/fields';
import { UploadSVG } from '@snack-uikit/icons';
import { ModalCustom } from '@snack-uikit/modal';

import { importModalClosed } from '#entities/modal/model';
import {
  $profileImportErrorInfo,
  $profileImportString,
  profileImported,
  profileImportLoadedFile,
  profileImportStringChanged,
} from '#features/import-profile/model';

import { TOOLTIP_JSON_FORMAT, TOOLTIP_TITLE } from './constants';
import * as S from './styled';

export function ImportModal() {
  const [
    profileImportString,
    { errorMessage, errorPosition, isError },
    handleImportModalClosed,
    handleProfileImported,
  ] = useUnit([$profileImportString, $profileImportErrorInfo, importModalClosed, profileImported]);

  const loadFileRef = useRef<HTMLInputElement>(null);
  const textFieldRef = useRef<HTMLTextAreaElement>(null);

  const handleProfileLoaded = useCallback((files: File[]) => {
    const currentFile = files?.[0];
    const fileStorage = loadFileRef.current;

    if (fileStorage) {
      fileStorage.value = '';
    }

    if (currentFile) {
      profileImportLoadedFile(currentFile);
    }
  }, []);

  useEffect(() => {
    if (isError && textFieldRef.current) {
      textFieldRef.current.focus();

      if (errorPosition) {
        textFieldRef.current.setSelectionRange(errorPosition, errorPosition);
      }
    }
  }, [errorPosition, isError]);

  return (
    <ModalCustom open onClose={handleImportModalClosed}>
      <ModalCustom.Header
        title={'Import profile'}
        data-test-id='import-profile-modal-title'
        titleTooltip={
          <>
            {TOOLTIP_TITLE}

            <pre>{JSON.stringify(TOOLTIP_JSON_FORMAT, null, 2)}</pre>
          </>
        }
      />
      <S.DropZone onFilesUpload={handleProfileLoaded} description='Drop files to upload'>
        <ModalCustom.Body
          content={
            <FieldTextArea
              size='m'
              ref={textFieldRef}
              label='JSON'
              value={profileImportString}
              onChange={profileImportStringChanged}
              minRows={4}
              maxRows={4}
              error={errorMessage ?? undefined}
              data-test-id='import-profile-json-textarea'
            />
          }
        />

        <ModalCustom.Footer
          actions={
            <>
              <ButtonFilled size='m' appearance='primary' label='Import' onClick={handleProfileImported} />

              <FileUpload onFilesUpload={handleProfileLoaded}>
                <ButtonSimple size='m' appearance='neutral' label='Load file' icon={<UploadSVG />} />
              </FileUpload>
            </>
          }
        />
      </S.DropZone>
    </ModalCustom>
  );
}
