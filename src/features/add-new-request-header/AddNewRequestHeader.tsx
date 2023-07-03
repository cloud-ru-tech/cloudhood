import AddIcon from '@mui/icons-material/Add';
import { IconButton } from '@mui/material';
import { useUnit } from 'effector-react';

import { addEmptyProfileHeader } from '#entities/request-header/model';

export function AddNewRequestHeader() {
  const handleAdd = useUnit(addEmptyProfileHeader);

  return (
    <IconButton onClick={handleAdd}>
      <AddIcon />
    </IconButton>
  );
}
