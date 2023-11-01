import { CSS, Transform } from '@dnd-kit/utilities';
import styled from '@emotion/styled';
import { Menu } from '@mui/material';

export const Wrapper = styled.div<{ transform: Transform | null; isDragging: boolean; transition?: string }>`
  display: flex;
  flex-direction: row;
  justify-content: space-between;

  transform: ${props => CSS.Transform.toString(props.transform)};
  opacity: ${props => (props.isDragging ? 0 : 1)};
  transition: ${props => props.transition};

  width: 100%;
`;

export const LeftHeaderActions = styled.div`
  display: flex;
  flex-direction: row;
`;

export const StyledMenu = styled(Menu)`
  li {
    width: 228px;
    justify-content: space-between;
  }
`;
