import AddIcon from '@mui/icons-material/Add';
import { IconButton } from '@mui/material';
import { addEmptyProfileHeader } from '../../entities/request-header/model';

export function AddNewRequestHeader() {
  return (
    <IconButton onClick={() => addEmptyProfileHeader()}>
      <AddIcon />
    </IconButton>
  );
}
