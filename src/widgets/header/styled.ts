import styled from '@emotion/styled';

import { themeVars } from '@snack-uikit/figma-tokens';
import { Droplist } from '@snack-uikit/list';

export const Wrapper = styled.div`
  display: flex;
  justify-content: space-between;
  color: ${themeVars.sys.neutral.textMain};
  width: 100%;
  padding: 12px;
  align-items: center;
`;

export const Actions = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
`;

export const StyledDroplist = styled(Droplist)`
  width: 328px;
`;
