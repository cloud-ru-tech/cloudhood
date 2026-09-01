import styled from '@emotion/styled';

import { themeVars } from '@snack-uikit/figma-tokens';

export const Handle = styled.div`
  position: absolute;
  left: 0;
  bottom: 0;
  width: 16px;
  height: 16px;
  padding: 0;
  border: 0;
  background:
    linear-gradient(
      225deg,
      transparent 0 45%,
      ${themeVars.sys.neutral.decorDefault} 45% 55%,
      transparent 55% 70%,
      ${themeVars.sys.neutral.decorDefault} 70% 80%,
      transparent 80%
    );
  cursor: nesw-resize;
  touch-action: none;
`;
