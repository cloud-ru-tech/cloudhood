import AddIcon from '@mui/icons-material/Add';
import { IconButton } from '@mui/material';
import { addEmptyProfileHeader } from '#entities/request-header/model';
import { useUnit } from 'effector-react';

export function AddNewRequestHeader() {
  const handleAdd = useUnit(addEmptyProfileHeader);

  return (
    <IconButton onClick={handleAdd}>
      <AddIcon />
    </IconButton>
  );
}
