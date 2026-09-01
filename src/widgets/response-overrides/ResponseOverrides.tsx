import { useUnit } from 'effector-react';

import { $isPaused } from '#entities/is-paused/model';
import { $selectedProfileResponseOverrides } from '#entities/request-profile/model';
import { useSortableList } from '#entities/sortable-list';
import { responseOverridesReordered } from '#features/selected-profile-response-overrides/reorder/model';

import { OverrideCard } from './components/OverrideCard';
import * as S from './styled';

export function ResponseOverrides() {
  const { isPaused, overrides, onReorder } = useUnit({
    isPaused: $isPaused,
    overrides: $selectedProfileResponseOverrides,
    onReorder: responseOverridesReordered,
  });

  const { listRef, moveByKeyboard } = useSortableList({ disabled: isPaused, items: overrides, onReorder });

  return (
    <S.Wrapper ref={listRef} data-test-id='response-overrides-list'>
      {overrides.map(override => (
        <OverrideCard
          key={override.id}
          override={override}
          onMove={direction => moveByKeyboard(override.id, direction)}
        />
      ))}
    </S.Wrapper>
  );
}
