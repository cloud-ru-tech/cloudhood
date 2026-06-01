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
`;

const legacyFieldStyles = `
  [data-test-id='field-container-private'] {
    border-radius: 12px;
  }
`;

export const HeaderFieldWrapper = styled.div<{ grow: number }>`
  flex: ${props => props.grow} 1 0;
  min-width: 0;
`;

export const HeaderNameField = styled(FieldText)`
  ${legacyFieldStyles}
`;

export const HeaderValueField = styled(FieldText)`
  ${legacyFieldStyles}
`;

export const StyledDroplist = styled(Droplist)`
  width: 228px;
`;
