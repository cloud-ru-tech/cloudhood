import '@cloud-ru/ds-figma-variables/build/css/tokens.css';

import './styles.css';

import { MainPage } from '#pages/main';

import { ThemeRoot } from './ThemeRoot';

export function App() {
  return (
    <ThemeRoot>
      <MainPage />
    </ThemeRoot>
  );
}
