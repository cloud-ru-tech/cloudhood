import { useSortable } from '@dnd-kit/sortable';
import ClearIcon from '@mui/icons-material/Clear';
import { Checkbox, IconButton, TextField } from '@mui/material';

import { RequestHeader } from '#entities/request-profile/types';
import { selectedProfileRequestHeadersRemoved } from '#features/selected-profile-request-headers/remove/model';
import { DragHandle } from '#features/selected-profile-request-headers/reorder/components';
import { selectedProfileRequestHeadersUpdated } from '#features/selected-profile-request-headers/update/model';

import * as S from './styled';

export function RequestHeaderRow(props: RequestHeader) {
  const { disabled, name, value, id } = props;
  const { setNodeRef, listeners, attributes, transition, transform, isDragging } = useSortable({ id });

  return (
    <S.Wrapper ref={setNodeRef} transform={transform} transition={transition} isDragging={isDragging}>
      <S.LeftHeaderActions>
        <DragHandle listeners={listeners} attributes={attributes} />
        <Checkbox
          color='default'
          checked={!disabled}
          onChange={e => selectedProfileRequestHeadersUpdated([{ ...props, disabled: !e.target.checked }])}
        />
        <TextField
          placeholder='Header name'
          variant='standard'
          value={name}
          onChange={e => selectedProfileRequestHeadersUpdated([{ ...props, name: e.target.value }])}
        />
      </S.LeftHeaderActions>
      <TextField
        placeholder='Header value'
        variant='standard'
        value={value}
        onChange={e => selectedProfileRequestHeadersUpdated([{ ...props, value: e.target.value }])}
      />
      <IconButton onClick={() => selectedProfileRequestHeadersRemoved([id])}>
        <ClearIcon />
      </IconButton>
    </S.Wrapper>
  );
}
