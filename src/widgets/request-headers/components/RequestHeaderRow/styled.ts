import styled from '@emotion/styled';

import { FieldText } from '@snack-uikit/fields';
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
`;

const legacyFieldStyles = `
  [data-test-id='field-container-private'] {
    border-radius: 12px;
  }
`;

export const HeaderFieldWrapper = styled.div<{ grow: number }>`
  flex: ${props => props.grow} 1 0;
  min-width: 0;
`;

export const HeaderNameField = styled(FieldText)`
  ${legacyFieldStyles}
`;

export const HeaderValueField = styled(FieldText)`
  ${legacyFieldStyles}
`;

export const StyledDroplist = styled(Droplist)`
  width: 228px;
`;
