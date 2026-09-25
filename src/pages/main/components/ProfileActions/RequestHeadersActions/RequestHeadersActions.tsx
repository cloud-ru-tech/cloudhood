import { useUnit } from 'effector-react';

import { Button } from '@cloud-ru/ds-button';
import { PlusSVG, TrashSVG } from '@cloud-ru/ds-icons/interface/system';
import { Typography } from '@cloud-ru/ds-typography';

import { $isPaused } from '#entities/is-paused/model';
import { $isProfileRemoveAvailable } from '#entities/request-profile/model';
import { selectedProfileRemoved } from '#features/selected-profile/remove/model';
import { selectedProfileRequestHeadersAdded } from '#features/selected-profile-request-headers/add/model';
import { ProfileActionsLayout } from '#shared/components';
import { RequestHeaders } from '#widgets/request-headers';

import { AllRequestHeadersCheckbox } from './AllRequestHeadersCheckbox';

export function RequestHeadersActions() {
  const [isPaused, handleRemove, isProfileRemoveAvailable, handleAddRequestHeader] = useUnit([
    $isPaused,
    selectedProfileRemoved,
    $isProfileRemoveAvailable,
    selectedProfileRequestHeadersAdded,
  ]);

  const onAddRequestHeader = () => {
    handleAddRequestHeader([{ disabled: false, name: '', value: '' }]);
  };

  const leftHeaderActions = (
    <>
      <AllRequestHeadersCheckbox />
      <Typography variant='title' size='m' data-test-id='profile-headers-section'>
        Profile headers
      </Typography>
    </>
  );

  const rightHeaderActions = (
    <>
      <Button
        size='l'
        view='function'
        appearance='neutral'
        disabled={isPaused}
        data-test-id='add-request-header-button'
        icon={<PlusSVG />}
        onClick={onAddRequestHeader}
      />

      <Button
        size='l'
        view='function'
        appearance='neutral'
        data-test-id='remove-request-header-button'
        icon={<TrashSVG />}
        disabled={isPaused || !isProfileRemoveAvailable}
        onClick={handleRemove}
      />
    </>
  );

  return (
    <ProfileActionsLayout leftHeaderActions={leftHeaderActions} rightHeaderActions={rightHeaderActions}>
      <RequestHeaders />
    </ProfileActionsLayout>
  );
}
