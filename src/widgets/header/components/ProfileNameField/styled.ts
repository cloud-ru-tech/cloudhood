import styled from '@emotion/styled';

import { themeVars } from '@cloud-ru/ds-figma-variables';
import { TruncateString } from '@cloud-ru/ds-truncate-string';

export const Title = styled(TruncateString)`
  ${themeVars.sn.regular.title.l}
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
  max-width: 400px;
`;

export const ButtonWrapper = styled.div`
  display: flex;
  flex-shrink: 0;
`;
