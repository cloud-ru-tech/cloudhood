import { useUnit } from 'effector-react';

import { ButtonFunction } from '@snack-uikit/button';
import { PlusSVG, TrashSVG } from '@snack-uikit/icons';
import { Switch } from '@snack-uikit/toggles';
import { Typography } from '@snack-uikit/typography';

import { $isPaused } from '#entities/is-paused/model';
import { removeAllResponseOverridesModalOpened } from '#entities/modal/model';
import { $responseOverridesDisabled, $selectedProfileResponseOverrides } from '#entities/request-profile/model';
import { profileResponseOverridesAdded } from '#features/selected-profile-response-overrides/add/model';
import { toggleAllProfileResponseOverrides } from '#features/selected-profile-response-overrides/toggle-all/model';
import { ProfileActionsLayout } from '#shared/components';
import { RESPONSE_OVERRIDE_COPY } from '#shared/constants';
import { ResponseOverrides } from '#widgets/response-overrides';

export function ResponseOverridesActions() {
  const [isPaused, overrides, disabled, handleAdd, handleToggleAll, handleOpenDeleteAll] = useUnit([
    $isPaused,
    $selectedProfileResponseOverrides,
    $responseOverridesDisabled,
    profileResponseOverridesAdded,
    toggleAllProfileResponseOverrides,
    removeAllResponseOverridesModalOpened,
  ]);

  const leftHeaderActions = (
    <>
      <Switch
        disabled={isPaused}
        checked={!disabled}
        onChange={handleToggleAll}
        data-test-id='response-overrides-master-switch'
      />
      <Typography.SansTitleM data-test-id='response-overrides-section'>{RESPONSE_OVERRIDE_COPY.section}</Typography.SansTitleM>
    </>
  );

  const rightHeaderActions = (
    <>
      <ButtonFunction
        disabled={isPaused}
        icon={<PlusSVG />}
        onClick={handleAdd}
        data-test-id='add-response-override-button'
      />
      <ButtonFunction
        icon={<TrashSVG />}
        disabled={isPaused || overrides.length === 0}
        onClick={handleOpenDeleteAll}
        data-test-id='remove-all-response-overrides-button'
      />
    </>
  );

  return (
    <ProfileActionsLayout leftHeaderActions={leftHeaderActions} rightHeaderActions={rightHeaderActions}>
      <ResponseOverrides />
    </ProfileActionsLayout>
  );
}
