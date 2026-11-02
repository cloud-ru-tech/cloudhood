import styled from '@emotion/styled';

import { themeVars } from '@cloud-ru/ds-figma-variables';

export const Wrapper = styled.div`
  background-color: ${themeVars.sn.theme.color.neutral.background1Level};
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

export const DnrWarningBanner = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 8px 12px;
  background: ${themeVars.sn.theme.color.orange.background};
  color: ${themeVars.sn.theme.color.orange.text};
  font-size: 12px;
  line-height: 16px;

  svg {
    color: ${themeVars.sn.theme.color.orange.accent};
    flex-shrink: 0;
  }
`;
