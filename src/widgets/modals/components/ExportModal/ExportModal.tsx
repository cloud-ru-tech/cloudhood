import { useUnit } from 'effector-react';
import { useCallback } from 'react';

import { FieldSelect, FieldTextArea } from '@snack-uikit/fields';
import { Modal } from '@snack-uikit/modal';

import { exportModalClosed } from '#entities/modal/model';
import {
  $profileExportString,
  $profilesNameOptions,
  $selectedExportProfileValue,
  profileExportDownloaded,
  profileExportSaved,
  profileExportStringChanged,
  profileNameExportChanged,
} from '#features/export-profile';

import * as S from './styled';

export function ExportModal() {
  const [
    downloadHandler,
    copyToClipboard,
    profileExportString,
    profilesNameOptions,
    selectedExportProfileValue,
    handleExportModalClosed,
  ] = useUnit([
    profileExportDownloaded,
    profileExportSaved,
    $profileExportString,
    $profilesNameOptions,
    $selectedExportProfileValue,
    exportModalClosed,
  ]);

  const handleProfilesChange = useCallback((value: string[]) => {
    if (value.length < 1) {
      return;
    }

    profileNameExportChanged(value);
  }, []);

  return (
    <Modal
      open
      onClose={handleExportModalClosed}
      title='Export profile'
      approveButton={{
        onClick: copyToClipboard,
        label: 'Copy',
      }}
      cancelButton={{
        onClick: downloadHandler,
        label: 'Download JSON',
      }}
      content={
        <S.Wrapper>
          <FieldSelect
            label='Profiles'
            selection='multiple'
            value={selectedExportProfileValue}
            size='m'
            options={profilesNameOptions}
            onChange={handleProfilesChange}
            showClearButton={false}
          />

          <FieldTextArea
            label='JSON'
            value={profileExportString}
            onChange={profileExportStringChanged}
            minRows={4}
            maxRows={4}
            size='m'
            data-test-id='export-profile-json-textarea'
          />
        </S.Wrapper>
      }
    />
  );
}
