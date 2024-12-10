import styled from '@emotion/styled';
import { TextField as _TextField } from '@mui/material';
import { themeVars } from '@snack-uikit/figma-tokens';
import { TruncateString } from '@snack-uikit/truncate-string';

export const Title = styled(TruncateString)`
  ${themeVars.sans.title.l}
`;

export const TextField = styled(_TextField)`
  .MuiInput-root:before {
    border-bottom-color: white;
  }
  .MuiInput-root:hover:not(.Mui-disabled, .Mui-error):before {
    border-bottom-color: white;
  }
  & .MuiInput-input {
    color: white;
  }
  & .MuiInput-underline:after {
    border-bottom-color: white;
  }
`;
