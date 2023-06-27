import { Pause, PlayArrow } from '@mui/icons-material';
import { IconButton } from '@mui/material';
import { grey } from '@mui/material/colors';
import { useUnit } from 'effector-react';
import { $isPaused, toggleIsPaused } from '../../entities/is-paused/model';

export function PauseAllRequestHeaders() {
  const isPaused = useUnit($isPaused);

  return (
    <IconButton sx={{ color: grey[100] }} onClick={() => toggleIsPaused()}>
      {isPaused ? <Pause /> : <PlayArrow />}
    </IconButton>
  );
}
