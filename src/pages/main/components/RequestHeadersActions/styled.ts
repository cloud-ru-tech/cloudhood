import styled from '@emotion/styled';
import { Backdrop } from '@mui/material';

export const Content = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 4px;

  overflow-y: auto;

  padding: 8px;
  padding-bottom: 0;
`;

export const LeftHeaderActions = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

export const RightHeaderActions = styled.div`
  display: flex;
  gap: 12px;
  margin-right: 16px;
  justify-content: flex-end;
  align-items: center;
`;

export const StyledBackdrop = styled(Backdrop)`
  position: absolute;
  z-index: 2;
`;

export const Header = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
`;
