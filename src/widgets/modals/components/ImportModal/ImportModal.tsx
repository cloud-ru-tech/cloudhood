import { useUnit } from 'effector-react';
import { ChangeEvent, useCallback, useEffect, useRef } from 'react';

import { FieldTextArea } from '@cloud-ru/ds-fields';
import { UploadSVG } from '@cloud-ru/ds-icons/interface/system';
import { Modal } from '@cloud-ru/ds-modal';
import { QuestionTooltip } from '@cloud-ru/ds-tooltip';

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
    onProfileImportLoadedFile,
    onProfileImportStringChanged,
  ] = useUnit([
    $profileImportString,
    $profileImportErrorInfo,
    importModalClosed,
    profileImported,
    profileImportLoadedFile,
    profileImportStringChanged,
  ]);

  const loadFileRef = useRef<HTMLInputElement>(null);
  const textFieldRef = useRef<HTMLTextAreaElement>(null);

  const handleProfileLoaded = useCallback(
    (files: File[]) => {
      const currentFile = files?.[0];
      const fileStorage = loadFileRef.current;

      if (fileStorage) {
        fileStorage.value = '';
      }

      if (currentFile) {
        onProfileImportLoadedFile(currentFile);
      }
    },
    [onProfileImportLoadedFile],
  );

  const handleFileInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => handleProfileLoaded(Array.from(event.target.files ?? [])),
    [handleProfileLoaded],
  );

  useEffect(() => {
    if (isError && textFieldRef.current) {
      textFieldRef.current.focus();

      if (errorPosition) {
        textFieldRef.current.setSelectionRange(errorPosition, errorPosition);
      }
    }
  }, [errorPosition, isError]);

  return (
    <Modal
      open
      onClose={handleImportModalClosed}
      title='Import profile'
      data-test-id='import-profile-modal'
      slotAfterTitle={
        <QuestionTooltip
          tip={
            <>
              {TOOLTIP_TITLE}

              <pre>{JSON.stringify(TOOLTIP_JSON_FORMAT, null, 2)}</pre>
            </>
          }
        />
      }
      content={
        <S.DropZone onFilesUpload={handleProfileLoaded} content='Drop files to upload'>
          <FieldTextArea
            size='l'
            ref={textFieldRef}
            label='JSON'
            value={profileImportString}
            onChange={onProfileImportStringChanged}
            minRows={4}
            maxRows={4}
            error={errorMessage ?? undefined}
            data-test-id='import-profile-json-textarea'
          />
          <input ref={loadFileRef} type='file' hidden onChange={handleFileInputChange} />
        </S.DropZone>
      }
      approveButton={{ label: 'Import', onClick: handleProfileImported }}
      additionalButton={{
        label: 'Load file',
        icon: <UploadSVG />,
        iconPosition: 'after',
        onClick: () => loadFileRef.current?.click(),
      }}
    />
  );
}
