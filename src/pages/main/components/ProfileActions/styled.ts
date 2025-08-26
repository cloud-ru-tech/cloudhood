import styled from '@emotion/styled';

import { themeVars } from '@snack-uikit/figma-tokens';

export const Content = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 8px;

  overflow-y: auto;

  padding: 8px 8px 0;
  gap: 20px;
`;

export const StyledBackdrop = styled.div`
  position: fixed;
  top: 64px;
  left: 52px;
  background: ${themeVars.sys.neutral.textMain};
  opacity: 0.3;
  width: 100%;
  height: 100%;
  display: none;

  &[data-open] {
    display: block;
  }
`;
