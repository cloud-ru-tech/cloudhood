import '@cloud-ru/ds-figma-variables/build/css/tokens.css';

import './styles.css';
import './options.css';

import { Settings } from '#widgets/settings';

import * as S from './options.styled';
import { ThemeRoot } from './ThemeRoot';

export function OptionsApp() {
  return (
    <ThemeRoot>
      <S.Page>
        <S.Panel>
          <Settings />
        </S.Panel>
      </S.Page>
    </ThemeRoot>
  );
}
