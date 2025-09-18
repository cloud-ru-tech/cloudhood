import styled from '@emotion/styled';

import { themeVars } from '@snack-uikit/figma-tokens';

export const LeftHeaderActions = styled.div`
  ${themeVars.sans.title.m}

  color: ${themeVars.sys.neutral.textMain};
  display: flex;
  gap: 8px;
  padding-left: 4px;
  align-items: center;
`;

export const RightHeaderActions = styled.div`
  display: flex;
  gap: 4px;
  justify-content: flex-end;
  align-items: center;
`;

export const Header = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  padding: 10px 0;
  position: sticky;
  top: 0;
  /* stylelint-disable-next-line declaration-property-value-allowed-list */
  z-index: 10;
  background-color: ${themeVars.sys.neutral.background1Level};
`;

export const ContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  flex: 0;
  gap: 20px;
`;
