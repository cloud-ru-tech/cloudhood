import styled from '@emotion/styled';

import { themeVars } from '@snack-uikit/figma-tokens';
import { Droplist } from '@snack-uikit/list';

export const Wrapper = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  gap: 4px;

  width: 100%;
  &.sortable-ghost {
    opacity: 0.28;
  }

  &.sortable-fallback {
    opacity: 0.96;
    border-radius: 12px;
    box-shadow: ${themeVars.boxShadow.elevation.level3};
  }
`;

export const LeftHeaderActions = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 4px;
  min-width: 280px;
`;

export const UrlFilterFieldWrapper = styled.div`
  flex: 1 1 0;
  min-width: 150px;

  [data-test-id='field-container-private'] {
    border-radius: 12px;
  }
`;

export const StyledDroplist = styled(Droplist)`
  width: 228px;
`;

export const Ul = styled.ul``;

export const Li = styled.li`
  ${themeVars.sans.body.m};
`;
