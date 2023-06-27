import styled from '@emotion/styled';
import { grey } from '@mui/material/colors';

export const Wrapper = styled.div`
  display: flex;
  flex-direction: row;

  height: 100%;
  width: 100%;
`;

export const Content = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  box-sizing: border-box;

  border-left: 2px solid ${grey[100]};
`;

export const ContentHeader = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;
