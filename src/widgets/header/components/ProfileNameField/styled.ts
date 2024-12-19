import styled from '@emotion/styled';

import { themeVars } from '@snack-uikit/figma-tokens';
import { TruncateString } from '@snack-uikit/truncate-string';

export const Title = styled(TruncateString)`
  ${themeVars.sans.title.l}
`;

export const Row = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  flex-grow: 1;
`;

export const TitleWrapper = styled.div`
  display: flex;
  flex-grow: 1;
  min-width: 0;
`;

export const ButtonWrapper = styled.div`
  display: flex;
  flex-shrink: 0;
`;
