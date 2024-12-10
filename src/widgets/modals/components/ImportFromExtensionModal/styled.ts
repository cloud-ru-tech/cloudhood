import styled from '@emotion/styled';

import { HiddenDropZone } from '@snack-uikit/drop-zone';

export const DropZone = styled(HiddenDropZone)`
  width: 100%;
  position: initial;
`;

export const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;
