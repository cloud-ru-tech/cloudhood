import styled from '@emotion/styled';

import { themeVars } from '@snack-uikit/figma-tokens';

export const Wrapper = styled.div`
  background-color: ${themeVars.sys.neutral.background1Level};
  display: flex;
  flex-direction: row;

  height: 100%;
  width: 100%;
`;

export const Content = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  box-sizing: border-box;
`;

export const ContentHeader = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

export const ColorLine = styled.div<{ color: string }>`
  width: 4px;
  background: ${({ color }) => color};
`;
