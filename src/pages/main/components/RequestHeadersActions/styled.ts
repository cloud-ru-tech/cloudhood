import styled from '@emotion/styled';
import { Backdrop } from '@mui/material';

export const Content = styled.div`
  display: flex;
  flex-direction: column;
  position: relative;
  flex: 1;
  gap: 16px;

  padding: 8px;
  padding-bottom: 0;
`;

export const ContentHeader = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

export const LeftHeaderActions = styled.div`
  display: flex;
  gap: 16px;
  align-items: center;
`;

export const RightHeaderActions = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
`;

export const StyledBackdrop = styled(Backdrop)`
  position: absolute;
  z-index: 2;
`;
