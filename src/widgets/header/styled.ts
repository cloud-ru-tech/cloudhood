import styled from '@emotion/styled';
import { Menu } from '@mui/material';

type WrapperProps = {
  backgroundColor: string;
  color: string;
};

export const Wrapper = styled.div<WrapperProps>`
  display: flex;
  justify-content: space-between;
  background-color: ${({ backgroundColor }) => backgroundColor};
  color: ${({ color }) => color};
  width: 100%;
  padding: 12px;
  padding-left: 16px;
  align-items: center;
`;

export const Actions = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;

  gap: 16px;
`;

export const StyledMenu = styled(Menu)`
  li {
    width: 328px;
    justify-content: space-between;
    padding: 12px 16px 12px 14px;
  }
`;
