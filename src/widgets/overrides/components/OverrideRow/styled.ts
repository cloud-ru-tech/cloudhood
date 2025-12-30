import { CSS, type Transform } from '@dnd-kit/utilities';
import styled from '@emotion/styled';

export const Wrapper = styled.div<{ transform: Transform | null; isDragging: boolean; transition?: string }>`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  gap: 4px;

  transform: ${props => CSS.Transform.toString(props.transform)};
  opacity: ${props => (props.isDragging ? 0 : 1)};
  transition: ${props => props.transition};

  width: 100%;
`;

export const LeftOverrideActions = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 4px;
  min-width: 280px;
`;
