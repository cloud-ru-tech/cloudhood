import { Pause, PlayArrow } from '@mui/icons-material';
import { IconButton } from '@mui/material';
import { grey } from '@mui/material/colors';
import { useUnit } from 'effector-react';

import { $isPaused, toggleIsPaused } from '#entities/is-paused/model';

export function PauseAllRequestHeaders() {
  const [isPaused, handleToggle] = useUnit([$isPaused, toggleIsPaused]);

  return (
    <IconButton sx={{ color: grey[100] }} onClick={handleToggle}>
      {!isPaused ? <Pause /> : <PlayArrow />}
    </IconButton>
  );
}
