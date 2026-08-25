import { ButtonFunction } from '@snack-uikit/button';

import { DragIndicatorSVG } from '#shared/assets/svg';

type DragHandleProps = {
  disabled?: boolean;
  icon?: React.ReactElement;
  size?: 's' | 'm' | 'l';
  onMove?: (direction: -1 | 1) => void;
} & React.HTMLAttributes<HTMLSpanElement>;

export function DragHandle({
  disabled = false,
  icon = <DragIndicatorSVG />,
  size = 's',
  onMove,
  ...props
}: DragHandleProps) {
  return (
    <span
      data-test-id='drag-handle'
      data-drag-handle
      role='button'
      aria-roledescription='sortable'
      aria-label='Reorder item. Use Up and Down arrow keys to move.'
      tabIndex={disabled ? -1 : 0}
      {...props}
      onKeyDown={event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          return;
        }

        if (event.key === 'ArrowUp') {
          event.preventDefault();
          onMove?.(-1);
        } else if (event.key === 'ArrowDown') {
          event.preventDefault();
          onMove?.(1);
        }
      }}
    >
      <ButtonFunction disabled={disabled} size={size} icon={icon} />
    </span>
  );
}
