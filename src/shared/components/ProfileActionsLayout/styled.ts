import styled from '@emotion/styled';

import { themeVars } from '@snack-uikit/figma-tokens';

export const LeftHeaderActions = styled.div`
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

export const Container = styled.div`
  display: grid;
  grid-template-areas:
    'header'
    'content';
  grid-template-rows: auto 1fr;
  height: 100%;
`;

export const Header = styled.div`
  grid-area: header;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  padding: 10px 0;
  position: sticky;
  top: 0;
  background-color: ${themeVars.sys.neutral.background1Level};
`;

export const ContentWrapper = styled.div`
  grid-area: content;
  display: flex;
  flex-direction: column;
  gap: 20px;
  overflow-y: auto;
`;
