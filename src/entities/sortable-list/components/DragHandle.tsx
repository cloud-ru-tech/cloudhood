import { useSortable } from '@dnd-kit/sortable';

import { ButtonFunction } from '@snack-uikit/button';

type DragHandleProps = {
  listeners: ReturnType<typeof useSortable>['listeners'];
  attributes: ReturnType<typeof useSortable>['attributes'];
  disabled?: boolean;
  icon?: React.ReactElement;
  size?: 's' | 'm' | 'l';
};

export function DragHandle({
  listeners,
  attributes,
  disabled = false,
  icon,
  size = 'm'
}: DragHandleProps) {
  return (
    <span {...listeners} {...attributes} tabIndex={disabled ? -1 : 0}>
      <ButtonFunction disabled={disabled} size={size} icon={icon} />
    </span>
  );
}
