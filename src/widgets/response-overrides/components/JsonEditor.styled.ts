import styled from '@emotion/styled';

import { themeVars } from '@snack-uikit/figma-tokens';

export const Root = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
  min-width: 0;

  &[data-disabled='true'] {
    opacity: 0.64;
    pointer-events: none;
  }
`;

export const EditorFrame = styled.div`
  width: 100%;
  min-width: 0;
  overflow: hidden;
  border: 1px solid ${themeVars.sys.neutral.decorDefault};
  border-radius: 12px;
  background-color: ${themeVars.sys.neutral.background2Level};

  &:focus-within {
    border-color: ${themeVars.sys.neutral.accentDefault};
  }

  &[data-invalid='true'] {
    border-color: ${themeVars.sys.red.decorDefault};
  }

  &[data-invalid='true']:focus-within {
    border-color: ${themeVars.sys.red.accentDefault};
  }
`;

export const Hint = styled.span`
  ${themeVars.sans.body.s};
  color: ${themeVars.sys.red.textMain};
`;
