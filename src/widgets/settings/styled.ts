import styled from '@emotion/styled';

import { themeVars } from '@snack-uikit/figma-tokens';

export const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  width: 100%;
  padding: 12px;
  color: ${themeVars.sys.neutral.textMain};
`;

export const Title = styled.h1`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  line-height: 24px;
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

export const SectionTitle = styled.h2`
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  line-height: 20px;
  color: ${themeVars.sys.neutral.textMain};
`;

export const SectionDescription = styled.p`
  margin: 0;
  font-size: 12px;
  line-height: 16px;
  color: ${themeVars.sys.neutral.textSupport};
`;
