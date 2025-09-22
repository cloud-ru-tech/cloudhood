import { useUnit } from 'effector-react';

import { ButtonFunction } from '@snack-uikit/button';
import { PlusSVG, TrashSVG } from '@snack-uikit/icons';
import { Typography } from '@snack-uikit/typography';

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
      <Typography.SansTitleM data-test-id='profile-headers-section'>Profile headers</Typography.SansTitleM>
    </>
  );

  const rightHeaderActions = (
    <>
      <ButtonFunction
        disabled={isPaused}
        data-test-id='add-request-header-button'
        icon={<PlusSVG />}
        onClick={handleAddRequestHeader}
      />
      <ButtonFunction
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
