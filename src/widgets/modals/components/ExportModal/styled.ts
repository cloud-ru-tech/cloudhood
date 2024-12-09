import styled from '@emotion/styled';
import { Box } from '@mui/material';

export const Wrapper = styled(Box)`
  position: absolute;
  top: 50%;
  left: 50%;
  width: 566px;
  transform: translate(-50%, -50%);
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0px 11px 15px -7px rgba(0, 0, 0, 0.2), 0px 24px 38px 3px rgba(0, 0, 0, 0.14),
    0px 9px 46px 8px rgba(0, 0, 0, 0.12);
  padding: 16px 8px 8px 24px;
`;
