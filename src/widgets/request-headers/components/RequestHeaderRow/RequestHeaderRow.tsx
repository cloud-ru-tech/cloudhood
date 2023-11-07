import { useSortable } from '@dnd-kit/sortable';
import ClearIcon from '@mui/icons-material/Clear';
import { Checkbox, IconButton, TextField } from '@mui/material';
import { ChangeEvent, ClipboardEvent, KeyboardEvent } from 'react';

import { RequestHeader } from '#entities/request-profile/types';
import { DELIMITER } from '#features/selected-profile-request-headers/paste/constant';
import { selectedProfileRequestHeadersPasted } from '#features/selected-profile-request-headers/paste/model';
import { selectedProfileRequestHeadersRemoved } from '#features/selected-profile-request-headers/remove/model';
import { DragHandle } from '#features/selected-profile-request-headers/reorder/components';
import { selectedProfileRequestHeadersUpdated } from '#features/selected-profile-request-headers/update/model';
import { validateStringBySpecialSymbols } from '#shared/utils/validateStringBySpecialSymbols';

import { RequestHeaderMenu } from './RequestHeaderMenu';
import * as S from './styled';

export function RequestHeaderRow(props: RequestHeader) {
  const { disabled, name, value, id } = props;
  const { setNodeRef, listeners, attributes, transition, transform, isDragging } = useSortable({ id });

  const handlePaste = (field: 'value' | 'name') => (e: ClipboardEvent<HTMLInputElement>) => {
    const value = e.clipboardData.getData('text/plain');
    if (!value.includes(DELIMITER)) {
      return;
    }
    e.preventDefault();
    selectedProfileRequestHeadersPasted({ id, value, field });
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    const target = e.target as HTMLInputElement;
    const cursorPosition = target.selectionStart;
    if (e.key === ' ' && cursorPosition === 0) {
      e.preventDefault();
    }
  };

  const handleChange = (field: 'value' | 'name') => (e: ChangeEvent<HTMLInputElement>) => {
    selectedProfileRequestHeadersUpdated([{ ...props, [field]: e.target.value }]);
  };

  const handleChecked = (e: ChangeEvent<HTMLInputElement>) => {
    selectedProfileRequestHeadersUpdated([{ ...props, disabled: !e.target.checked }]);
  };

  return (
    <S.Wrapper ref={setNodeRef} transform={transform} transition={transition} isDragging={isDragging}>
      <S.LeftHeaderActions>
        <DragHandle listeners={listeners} attributes={attributes} />
        <Checkbox color='default' checked={!disabled} onChange={handleChecked} />
        <TextField
          error={Boolean(name.length) && !validateStringBySpecialSymbols(name)}
          placeholder='Header name'
          variant='standard'
          value={name}
          onKeyDown={handleKeyPress}
          onPaste={handlePaste('name')}
          onChange={handleChange('name')}
        />
      </S.LeftHeaderActions>
      <TextField
        error={Boolean(value.length) && !validateStringBySpecialSymbols(value)}
        placeholder='Header value'
        variant='standard'
        value={value}
        onKeyDown={handleKeyPress}
        onPaste={handlePaste('value')}
        onInput={handleChange('value')}
      />
      <IconButton onClick={() => selectedProfileRequestHeadersRemoved([id])}>
        <ClearIcon />
      </IconButton>
      <RequestHeaderMenu {...props} />
    </S.Wrapper>
  );
}
