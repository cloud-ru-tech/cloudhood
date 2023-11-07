import styled from '@emotion/styled';
import { Menu } from '@mui/material';

export const Wrapper = styled.div`
  display: flex;
  justify-content: space-between;
  background-color: #5600e8;
  width: 100%;
  padding: 12px;
  padding-left: 16px;
  align-items: center;
`;

export const Actions = styled.div`
  display: flex;
  flex-direction: row;

  gap: 16px;
`;

export const StyledMenu = styled(Menu)`
  li {
    width: 328px;
    justify-content: space-between;
    padding: 12px 16px 12px 14px;
  }
`;
