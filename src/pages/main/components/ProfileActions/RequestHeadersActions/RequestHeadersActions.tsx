import { useUnit } from 'effector-react';

import { ButtonFunction } from '@snack-uikit/button';
import { PlusSVG } from '@snack-uikit/icons';
import { Typography } from '@snack-uikit/typography';

import { $isPaused } from '#entities/is-paused/model';
import { selectedProfileRequestHeadersAdded } from '#features/selected-profile-request-headers/add/model';
import { ProfileActionsLayout } from '#shared/components';
import { RequestHeaders } from '#widgets/request-headers';

import { AllRequestHeadersCheckbox } from './AllRequestHeadersCheckbox';

export function RequestHeadersActions() {
  const [isPaused] = useUnit([$isPaused]);

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
    <ButtonFunction
      disabled={isPaused}
      data-test-id='add-request-header-button'
      icon={<PlusSVG />}
      onClick={handleAddRequestHeader}
    />
  );

  return (
    <ProfileActionsLayout leftHeaderActions={leftHeaderActions} rightHeaderActions={rightHeaderActions}>
      <RequestHeaders />
    </ProfileActionsLayout>
  );
}
