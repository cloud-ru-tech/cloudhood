import ClearIcon from '@mui/icons-material/Clear';
import { Checkbox, IconButton, TextField } from '@mui/material';
import { removeProfileHeader, updateProfileHeader } from '#entities/request-header/model';
import { RequestHeader } from '#entities/request-header/types';
import * as S from './styled';

export function RequestHeaderRow(props: RequestHeader) {
  const { disabled, name, value, id } = props;

  return (
    <S.Wrapper>
      <Checkbox
        color='default'
        checked={!disabled}
        onChange={e => updateProfileHeader({ ...props, disabled: !e.target.checked })}
      />
      <TextField
        placeholder='Header name'
        variant='standard'
        value={name}
        onChange={e => updateProfileHeader({ ...props, name: e.target.value })}
      />
      <TextField
        placeholder='Header value'
        variant='standard'
        value={value}
        onChange={e => updateProfileHeader({ ...props, value: e.target.value })}
      />
      <IconButton onClick={() => removeProfileHeader({ headerId: id })}>
        <ClearIcon />
      </IconButton>
    </S.Wrapper>
  );
}
