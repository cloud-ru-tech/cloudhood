import ClearIcon from '@mui/icons-material/Clear';
import { Checkbox, IconButton, TextField } from '@mui/material';

import { removeProfileHeaders, updateProfileHeaders } from '#entities/request-profile/model';
import { RequestHeader } from '#entities/request-profile/types';

import * as S from './styled';

export function RequestHeaderRow(props: RequestHeader) {
  const { disabled, name, value, id } = props;

  return (
    <S.Wrapper>
      <Checkbox
        color='default'
        checked={!disabled}
        onChange={e => updateProfileHeaders([{ ...props, disabled: !e.target.checked }])}
      />
      <TextField
        placeholder='Header name'
        variant='standard'
        value={name}
        onChange={e => updateProfileHeaders([{ ...props, name: e.target.value }])}
      />
      <TextField
        placeholder='Header value'
        variant='standard'
        value={value}
        onChange={e => updateProfileHeaders([{ ...props, value: e.target.value }])}
      />
      <IconButton onClick={() => removeProfileHeaders([{ headerId: id }])}>
        <ClearIcon />
      </IconButton>
    </S.Wrapper>
  );
}
