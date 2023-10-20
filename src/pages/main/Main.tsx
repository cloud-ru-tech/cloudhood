import { Header } from '#widgets/header';
import { Modals } from '#widgets/modals';
import { Sidebar } from '#widgets/sidebar';

import { RequestHeadersActions } from './components/RequestHeadersActions';
import * as S from './styled';

export function MainPage() {
  return (
    <S.Wrapper>
      <Sidebar />
      <S.Content>
        <Header />
        <RequestHeadersActions />
        <Modals />
      </S.Content>
    </S.Wrapper>
  );
}
