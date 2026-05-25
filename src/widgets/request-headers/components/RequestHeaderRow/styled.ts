import { CSS, type Transform } from '@dnd-kit/utilities';
import styled from '@emotion/styled';

import { FieldText } from '@snack-uikit/fields';
import { Droplist } from '@snack-uikit/list';

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

export const LeftHeaderActions = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 4px;
  min-width: 280px;
`;

const legacyFieldStyles = `
  [data-test-id='field-container-private'] {
    border-radius: 12px;
  }
`;

export const HeaderNameField = styled(FieldText)`
  width: 216px;

  ${legacyFieldStyles}
`;

export const HeaderValueField = styled(FieldText)`
  width: 205px;

  ${legacyFieldStyles}
`;

export const StyledDroplist = styled(Droplist)`
  width: 228px;
`;
