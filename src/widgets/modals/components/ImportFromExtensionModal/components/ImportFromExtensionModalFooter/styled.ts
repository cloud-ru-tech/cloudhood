import styled from '@emotion/styled';
import { Button, ButtonProps } from '@mui/material';

export const ImportButton = styled(Button)`
  background-color: #5600e8;
  padding: 6px 14px;
  letter-spacing: 1.25px;
`;

export const LoadButton = styled(Button)<ButtonProps & { component: React.ElementType }>`
  color: #5600e8;
  padding: 6px 14px 6px 8px;
  letter-spacing: 1.25px;

  .MuiButton-startIcon {
    margin-right: 6px;
  }
`;

export const VisuallyHiddenInput = styled.input`
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
  height: 1px;
  overflow: hidden;
  position: absolute;
  bottom: 0;
  left: 0;
  white-space: nowrap;
  width: 1px;
`;
