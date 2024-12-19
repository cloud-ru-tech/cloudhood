import styled from '@emotion/styled';

export const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  width: 48px;
`;

export const ProfilesWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 6px 0;

  overflow-y: auto;

  &::-webkit-scrollbar {
    display: none;
  }

  -ms-overflow-style: none; /* IE and Edge */
  scrollbar-width: none; /* Firefox */
`;

export const IconButtonWrapper = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  align-items: center;
  gap: 4px;
  padding: 4px 0;
  justify-content: space-between;
`;
