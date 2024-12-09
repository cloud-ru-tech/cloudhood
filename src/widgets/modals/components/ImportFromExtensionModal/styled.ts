import styled from '@emotion/styled';
import { Box } from '@mui/material';

export const Wrapper = styled(Box)`
  position: absolute;
  top: 126px;
  left: 50%;
  width: 562px;
  transform: translate(-50%, calc(-50% + 126px));
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0px 8px 10px 0px rgba(0, 0, 0, 0.2), 0px 6px 30px 0px rgba(0, 0, 0, 0.12),
    0px 16px 24px 0px rgba(0, 0, 0, 0.14);
  padding: 16px 8px 8px 24px;
`;
