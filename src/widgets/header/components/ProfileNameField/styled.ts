import styled from '@emotion/styled';
import _EditIcon from '@mui/icons-material/Edit';
import { TextField as _TextField, Typography as _Typography } from '@mui/material';
import { grey } from '@mui/material/colors';

export const EditIcon = styled(_EditIcon)`
  fill: ${grey[100]};

  &:hover {
    cursor: pointer;
  }
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

export const Typography = styled(_Typography)`
  width: fit-content;
  max-width: 100%;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 1;
  overflow: hidden;
  word-break: break-all;
`;
