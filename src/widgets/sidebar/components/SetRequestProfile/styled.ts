import styled from '@emotion/styled';
import { themeVars } from '@snack-uikit/figma-tokens';

type CircleProps = {
  color: string;
  backgroundColor: string;
  borderColor: string;
};

export const Circle = styled.div<CircleProps>`
  ${themeVars.sans.title.m};
  color: ${({ color }) => color};
  display: grid;
  place-items: center;
  box-sizing: border-box;

  min-height: 36px;
  width: 36px;

  cursor: pointer;
  border-radius: 50%;
  border-width: 2px;
  border-style: solid;
  border-color: transparent;

  background-color: ${({ backgroundColor }) => backgroundColor};

  &[data-selected] {
    border-color: ${({ borderColor }) => borderColor};
  }
`;
