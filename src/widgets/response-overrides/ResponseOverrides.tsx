import { useUnit } from 'effector-react';

import { $selectedProfileResponseOverrides } from '#entities/request-profile/model';

import { OverrideCard } from './components/OverrideCard';
import * as S from './styled';

export function ResponseOverrides() {
  const overrides = useUnit($selectedProfileResponseOverrides);

  return (
    <S.Wrapper data-test-id='response-overrides-list'>
      {overrides.map(override => (
        <OverrideCard key={override.id} override={override} />
      ))}
    </S.Wrapper>
  );
}
