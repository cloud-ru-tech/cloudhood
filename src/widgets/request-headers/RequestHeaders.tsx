import { useUnit } from 'effector-react';

import { $selectedProfileRequestHeaders } from '#entities/request-header/model';

import { RequestHeaderRow } from './components/RequestHeaderRow';
import * as S from './styled';

export function RequestHeaders() {
  const requestHeaders = useUnit($selectedProfileRequestHeaders);

  return (
    <S.Wrapper>
      {requestHeaders.map(header => (
        <RequestHeaderRow key={header.id} {...header} />
      ))}
    </S.Wrapper>
  );
}
