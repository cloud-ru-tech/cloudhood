import { useUnit } from 'effector-react';

import { ButtonFunction } from '@snack-uikit/button';
import { PlusSVG, TrashSVG } from '@snack-uikit/icons';
import { Typography } from '@snack-uikit/typography';

import { $isPaused } from '#entities/is-paused/model';
import { $isProfileRemoveAvailable } from '#entities/request-profile/model';
import { selectedProfileRemoved } from '#features/selected-profile/remove/model';
import { selectedProfileResponseOverridesAdded } from '#features/selected-profile-overrides/add/model';
import { ProfileActionsLayout } from '#shared/components';
import { Overrides } from '#widgets/overrides';

import { AllOverridesCheckbox } from './AllOverridesCheckbox';

export function OverridesActions() {
  const [isPaused, handleRemove, isProfileRemoveAvailable] = useUnit([
    $isPaused,
    selectedProfileRemoved,
    $isProfileRemoveAvailable,
  ]);

  const handleAddResponseOverride = () => {
    selectedProfileResponseOverridesAdded([{ disabled: false, urlPattern: '', responseContent: '' }]);
  };

  const leftHeaderActions = (
    <>
      <AllOverridesCheckbox />
      <Typography.SansTitleM data-test-id='profile-overrides-section'>Response Overrides</Typography.SansTitleM>
    </>
  );

  const rightHeaderActions = (
    <>
      <ButtonFunction
        disabled={isPaused}
        data-test-id='add-response-override-button'
        icon={<PlusSVG />}
        onClick={handleAddResponseOverride}
      />
      <ButtonFunction
        data-test-id='remove-response-override-button'
        icon={<TrashSVG />}
        disabled={isPaused || !isProfileRemoveAvailable}
        onClick={handleRemove}
      />
    </>
  );

  return (
    <ProfileActionsLayout leftHeaderActions={leftHeaderActions} rightHeaderActions={rightHeaderActions}>
      <Overrides />
    </ProfileActionsLayout>
  );
}
