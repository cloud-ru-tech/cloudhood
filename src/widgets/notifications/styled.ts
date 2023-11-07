import styled from '@emotion/styled';
import { Button, Snackbar as _Snackbar } from '@mui/material';

export const ButtonAction = styled(Button)`
  color: #bb86fc;
`;

export const Snackbar = styled(_Snackbar)`
  width: 345px;

  .MuiSnackbarContent-root {
    padding: 6px 8px 6px 16px;
    background-color: rgba(0, 0, 0, 0.87);
  }
`;
