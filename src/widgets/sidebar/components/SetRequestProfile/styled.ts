import styled from '@emotion/styled';

import { themeVars } from '@snack-uikit/figma-tokens';

type CircleProps = {
  color: string;
  backgroundColor: string;
};

export const Circle = styled.div<CircleProps>`
  ${themeVars.sans.title.m};

  color: ${({ color }) => color};
  display: grid;
  place-items: center;

  min-height: 48px;
  width: 48px;

  cursor: pointer;
  border-radius: 50%;
  border-width: 8px;
  border-style: solid;
  border-color: ${themeVars.sys.neutral.background1Level};

  background-color: ${({ backgroundColor }) => backgroundColor};

  &[data-selected] {
    border-radius: 0;
    border-color: ${({ backgroundColor }) => backgroundColor};
  }
`;
