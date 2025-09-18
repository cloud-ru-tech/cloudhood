import { useUnit } from 'effector-react';

import { ButtonFunction } from '@snack-uikit/button';
import { PlusSVG, TrashSVG } from '@snack-uikit/icons';

import { $isPaused } from '#entities/is-paused/model';
import { $isProfileRemoveAvailable } from '#entities/request-profile/model';
import { selectedProfileRemoved } from '#features/selected-profile/remove/model';
import { selectedProfileRequestHeadersAdded } from '#features/selected-profile-request-headers/add/model';
import { ProfileActionsLayout } from '#shared/components';
import { RequestHeaders } from '#widgets/request-headers';

import { AllRequestHeadersCheckbox } from './AllRequestHeadersCheckbox';

export function RequestHeadersActions() {
  const [isPaused, handleRemove, isProfileRemoveAvailable] = useUnit([
    $isPaused,
    selectedProfileRemoved,
    $isProfileRemoveAvailable,
  ]);

  const handleAddRequestHeader = () => {
    selectedProfileRequestHeadersAdded([{ disabled: false, name: '', value: '' }]);
  };

  const leftHeaderActions = (
    <>
      <AllRequestHeadersCheckbox />
      Profile headers
    </>
  );

  const rightHeaderActions = (
    <>
      <ButtonFunction disabled={isPaused} icon={<PlusSVG />} onClick={handleAddRequestHeader} />
      <ButtonFunction icon={<TrashSVG />} disabled={isPaused || !isProfileRemoveAvailable} onClick={handleRemove} />
    </>
  );

  return (
    <ProfileActionsLayout leftHeaderActions={leftHeaderActions} rightHeaderActions={rightHeaderActions}>
      <RequestHeaders />
    </ProfileActionsLayout>
  );
}
