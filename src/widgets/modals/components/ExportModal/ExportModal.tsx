import { useUnit } from 'effector-react';
import { useCallback } from 'react';

import { FieldSelect, FieldTextArea } from '@cloud-ru/ds-fields';
import { ItemId } from '@cloud-ru/ds-list';
import { Modal } from '@cloud-ru/ds-modal';

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
    onProfileNameExportChanged,
    onProfileExportStringChanged,
  ] = useUnit([
    profileExportDownloaded,
    profileExportSaved,
    $profileExportString,
    $profilesNameOptions,
    $selectedExportProfileValue,
    exportModalClosed,
    profileNameExportChanged,
    profileExportStringChanged,
  ]);

  const handleProfilesChange = useCallback(
    (value: ItemId[]) => {
      if (value.length < 1) {
        return;
      }

      onProfileNameExportChanged(value.map(String));
    },
    [onProfileNameExportChanged],
  );

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
            size='l'
            items={profilesNameOptions}
            onChange={handleProfilesChange}
            showClearButton={false}
          />

          <FieldTextArea
            label='JSON'
            value={profileExportString}
            onChange={onProfileExportStringChanged}
            minRows={4}
            maxRows={4}
            size='l'
            data-test-id='export-profile-json-textarea'
          />
        </S.Wrapper>
      }
    />
  );
}
