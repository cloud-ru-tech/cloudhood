import styled from '@emotion/styled';

import { themeVars } from '@cloud-ru/ds-figma-variables';

export const Page = styled.main`
  display: flex;
  justify-content: center;
  min-height: 100vh;
  background: ${themeVars.sn.theme.color.neutral.background1Level};
  color: ${themeVars.sn.theme.color.available.version.textMain};
`;

export const Panel = styled.div`
  width: 100%;
  max-width: 480px;
  padding: 8px 0 32px;
`;
