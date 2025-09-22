import { useUnit } from 'effector-react';
import { useCallback, useEffect, useMemo, useRef } from 'react';

import { ButtonFilled, ButtonSimple } from '@snack-uikit/button';
import { FileUpload } from '@snack-uikit/drop-zone';
import { FieldSelect, FieldTextArea } from '@snack-uikit/fields';
import { UploadSVG } from '@snack-uikit/icons';
import { ModalCustom } from '@snack-uikit/modal';

import { importFromExtensionModalClosed } from '#entities/modal/model';
import {
  $profileImportExtensionName,
  profileImportExtensionNameChanged,
} from '#features/import-profile/extensions/model';
import {
  $profileImportErrorInfo,
  $profileImportString,
  profileImported,
  profileImportLoadedFile,
  profileImportStringChanged,
} from '#features/import-profile/model';
import { Extensions } from '#shared/constants';

import * as S from './styled';

export function ImportFromExtensionModal() {
  const [
    handleImportFromExtensionModalClosed,
    handleProfileImported,
    profileImportExtensionName,
    profileImportString,
    { errorMessage, errorPosition, isError },
  ] = useUnit([
    importFromExtensionModalClosed,
    profileImported,
    $profileImportExtensionName,
    $profileImportString,
    $profileImportErrorInfo,
  ]);

  const textFieldRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isError && textFieldRef.current) {
      textFieldRef.current.focus();

      if (errorPosition) {
        textFieldRef.current.setSelectionRange(errorPosition, errorPosition);
      }
    }
  }, [errorPosition, isError]);

  const menuItems = useMemo(() => Object.entries(Extensions).map(([key, value]) => ({ option: key, value })), []);

  const loadFileRef = useRef<HTMLInputElement>(null);

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

  return (
    <ModalCustom open onClose={handleImportFromExtensionModalClosed}>
      <ModalCustom.Header title={'Import from other extension'} />
      <S.DropZone onFilesUpload={handleProfileLoaded} description='Drop files to upload'>
        <ModalCustom.Body
          content={
            <S.Wrapper>
              <FieldSelect
                size='m'
                selection='single'
                label='Other extension'
                value={profileImportExtensionName ?? undefined}
                onChange={profileImportExtensionNameChanged}
                options={menuItems}
                showClearButton={false}
              />

              <FieldTextArea
                size='m'
                ref={textFieldRef}
                label='JSON'
                value={profileImportString}
                onChange={profileImportStringChanged}
                maxRows={4}
                minRows={4}
                error={isError && errorMessage ? errorMessage : undefined}
              />
            </S.Wrapper>
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
