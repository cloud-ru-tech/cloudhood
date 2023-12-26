import styled from '@emotion/styled';

export const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  gap: 12px;

  padding: 16px 12px 8px 12px;
`;

export const ProfilesWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;

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
  justify-content: space-between;
`;
