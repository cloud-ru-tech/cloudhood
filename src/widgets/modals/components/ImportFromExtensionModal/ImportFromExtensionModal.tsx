import { useUnit } from 'effector-react';
import { ChangeEvent, useCallback, useEffect, useMemo, useRef } from 'react';

import { FieldSelect, FieldTextArea } from '@cloud-ru/ds-fields';
import { UploadSVG } from '@cloud-ru/ds-icons/interface/system';
import { Modal } from '@cloud-ru/ds-modal';

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
    onProfileImportLoadedFile,
    onProfileImportExtensionNameChanged,
    onProfileImportStringChanged,
  ] = useUnit([
    importFromExtensionModalClosed,
    profileImported,
    $profileImportExtensionName,
    $profileImportString,
    $profileImportErrorInfo,
    profileImportLoadedFile,
    profileImportExtensionNameChanged,
    profileImportStringChanged,
  ]);

  const textFieldRef = useRef<HTMLTextAreaElement>(null);

  // Preselect ModHeader when opening the modal without a chosen extension. Done here (not via a
  // store default) so the plain "Import profile" flow keeps a `null` extension name and never runs
  // an adapter.
  useEffect(() => {
    if (!profileImportExtensionName) {
      onProfileImportExtensionNameChanged(Extensions.ModHeader);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isError && textFieldRef.current) {
      textFieldRef.current.focus();

      if (errorPosition) {
        textFieldRef.current.setSelectionRange(errorPosition, errorPosition);
      }
    }
  }, [errorPosition, isError]);

  const menuItems = useMemo(
    () => Object.entries(Extensions).map(([key, value]) => ({ id: value, content: { label: key } })),
    [],
  );

  const loadFileRef = useRef<HTMLInputElement>(null);

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

  return (
    <Modal
      open
      onClose={handleImportFromExtensionModalClosed}
      title='Import from other extension'
      content={
        <S.DropZone onFilesUpload={handleProfileLoaded} content='Drop files to upload'>
          <S.Wrapper>
            <FieldSelect
              size='l'
              selection='single'
              label='Other extension'
              value={profileImportExtensionName ?? undefined}
              onChange={value => onProfileImportExtensionNameChanged(String(value ?? ''))}
              items={menuItems}
              showClearButton={false}
            />

            <FieldTextArea
              size='l'
              ref={textFieldRef}
              label='JSON'
              value={profileImportString}
              onChange={onProfileImportStringChanged}
              maxRows={4}
              minRows={4}
              error={isError && errorMessage ? errorMessage : undefined}
            />
          </S.Wrapper>
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
