import styled from '@emotion/styled';

import { themeVars } from '@cloud-ru/ds-figma-variables';
import { Droplist } from '@cloud-ru/ds-list';

export const Wrapper = styled.div`
  display: flex;
  justify-content: space-between;
  color: ${themeVars.sn.theme.color.available.version.textMain};
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
