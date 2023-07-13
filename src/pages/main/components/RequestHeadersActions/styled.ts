import styled from '@emotion/styled';
import { Backdrop } from '@mui/material';

export const Content = styled.div`
  position: relative;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  grid-template-rows: fit-content(100%);
  flex: 1;
  gap: 16px;

  overflow-y: auto;

  padding: 8px;
  padding-bottom: 0;
`;

export const LeftHeaderActions = styled.div`
  grid-area: 1 / 1 / 2 / 3;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

export const RightHeaderActions = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  align-items: center;
  grid-area: 1 / 4 / 2 / 6;
`;

export const StyledBackdrop = styled(Backdrop)`
  position: absolute;
  z-index: 2;
`;
