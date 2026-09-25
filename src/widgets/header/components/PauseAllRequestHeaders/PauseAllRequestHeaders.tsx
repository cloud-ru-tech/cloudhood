import { useUnit } from 'effector-react';

import { Button } from '@cloud-ru/ds-button';

import { $isPaused, toggleIsPaused } from '#entities/is-paused/model';
import { PauseSVG, PlayArrowSVG } from '#shared/assets/svg';

export function PauseAllRequestHeaders() {
  const [isPaused, handleToggle] = useUnit([$isPaused, toggleIsPaused]);

  return (
    <Button
      view='function'
      appearance='neutral'
      icon={!isPaused ? <PauseSVG /> : <PlayArrowSVG />}
      onClick={handleToggle}
      size='l'
      data-test-id='pause-button'
    />
  );
}
