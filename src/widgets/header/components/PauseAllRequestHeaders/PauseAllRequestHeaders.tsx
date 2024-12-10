import { useUnit } from 'effector-react';

import { ButtonFunction } from '@snack-uikit/button';

import { $isPaused, toggleIsPaused } from '#entities/is-paused/model';
import { PauseSVG, PlayArrowSVG } from '#shared/assets/svg';

export function PauseAllRequestHeaders() {
  const [isPaused, handleToggle] = useUnit([$isPaused, toggleIsPaused]);

  return (
    <ButtonFunction
      appearance='neutral'
      icon={!isPaused ? <PauseSVG /> : <PlayArrowSVG />}
      onClick={handleToggle}
      size='m'
    />
  );
}
