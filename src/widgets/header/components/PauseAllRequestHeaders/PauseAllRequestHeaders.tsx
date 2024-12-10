import { Pause, PlayArrow } from '@mui/icons-material';
import { ButtonTonal } from '@snack-uikit/button';
import { useUnit } from 'effector-react';

import { $isPaused, toggleIsPaused } from '#entities/is-paused/model';

export function PauseAllRequestHeaders() {
  const [isPaused, handleToggle] = useUnit([$isPaused, toggleIsPaused]);

  return (
    <ButtonTonal appearance='neutral' icon={!isPaused ? <Pause /> : <PlayArrow />} onClick={handleToggle} size='m' />
  );
}
