import styled from '@emotion/styled';

type CircleProps = {
  isSelected: boolean;
};

export const Circle = styled.div<CircleProps>`
  display: grid;
  place-items: center;

  min-height: 24px;
  width: 24px;

  cursor: pointer;
  border-radius: 50%;

  background-color: ${({ isSelected }) => (isSelected ? '#BB86FC' : '#00000099')};
`;
