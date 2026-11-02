import styled from '@emotion/styled';

import { themeVars } from '@cloud-ru/ds-figma-variables';

export const Root = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
`;

export const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  width: 100%;
  padding: 12px;
  color: ${themeVars.sn.theme.color.available.version.textMain};
`;

export const Content = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 20px;
  padding: 16px 12px;
  overflow-y: auto;
`;

export const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const SectionDescription = styled.p`
  margin: 0;
  font-size: 12px;
  line-height: 16px;
  color: ${themeVars.sn.theme.color.available.version.textSecondary};
`;

export const Actions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;
