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
`;

export const LeftHeaderActions = styled.div`
  ${themeVars.sans.title.m}

  color: ${themeVars.sys.neutral.textMain};
  display: flex;
  gap: 8px;
  padding-left: 8px;
  align-items: center;
`;

export const RightHeaderActions = styled.div`
  display: flex;
  gap: 4px;
  justify-content: flex-end;
  align-items: center;
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

export const Header = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
`;
