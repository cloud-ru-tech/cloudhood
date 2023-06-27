import { Checkbox } from '@mui/material';
import { useUnit } from 'effector-react';
import { $isAllEnabled, toggleAllProfileRequestHeaders } from './model';

export function ToggleAllRequestHeaders() {
  const isAllEnabled = useUnit($isAllEnabled);

  return (
    <Checkbox color='default' checked={isAllEnabled} onChange={e => toggleAllProfileRequestHeaders(e.target.checked)} />
  );
}
