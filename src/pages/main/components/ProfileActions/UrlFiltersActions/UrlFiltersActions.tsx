import { useUnit } from 'effector-react';

import { ButtonFunction } from '@snack-uikit/button';
import { PlusSVG, TrashSVG } from '@snack-uikit/icons';

import { $isPaused } from '#entities/is-paused/model';
import { profileUrlFiltersAdded } from '#features/selected-profile-url-filters/add/model';
import { selectedProfileAllUrlFiltersRemoved } from '#features/selected-profile-url-filters/remove-all/model';
import { ProfileActionsLayout } from '#shared/components';
import { UrlFilters } from '#widgets/url-filters';

import { AllUrlFiltersCheckbox } from './AllUrlFiltersCheckbox';

export function UrlFiltersActions() {
  const [isPaused, handleRemove] = useUnit([$isPaused, selectedProfileAllUrlFiltersRemoved]);

  const handleAddUrlFilter = () => {
    profileUrlFiltersAdded();
  };

  const leftHeaderActions = (
    <>
      <AllUrlFiltersCheckbox />
      Request URL filters
    </>
  );

  const rightHeaderActions = (
    <>
      <ButtonFunction disabled={isPaused} icon={<PlusSVG />} onClick={handleAddUrlFilter} />
      <ButtonFunction icon={<TrashSVG />} disabled={isPaused} onClick={handleRemove} />
    </>
  );

  return (
    <ProfileActionsLayout leftHeaderActions={leftHeaderActions} rightHeaderActions={rightHeaderActions}>
      <UrlFilters />
    </ProfileActionsLayout>
  );
}
