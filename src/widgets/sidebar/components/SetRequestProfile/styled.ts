import styled from '@emotion/styled';

type CircleProps = {
  isSelected: boolean;
  bgColor: string;
};

export const Circle = styled.div<CircleProps>`
  display: grid;
  place-items: center;

  min-height: 24px;
  width: 24px;

  cursor: pointer;
  border-radius: 50%;
  border-width: 2px;
  border-style: solid;
  border-color: ${({ isSelected }) => (isSelected ? '#00000099' : 'transparent')};

  background-color: ${({ bgColor }) => bgColor};
`;
