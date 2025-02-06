import { useSortable } from '@dnd-kit/sortable';

import { ButtonFunction } from '@snack-uikit/button';

import { DragIndicatorSVG } from '#shared/assets/svg';

type DragHandleProps = {
  listeners: ReturnType<typeof useSortable>['listeners'];
  attributes: ReturnType<typeof useSortable>['attributes'];
  disabled?: boolean;
};

export function DragHandle({ listeners, attributes, disabled = false }: DragHandleProps) {
  return (
    <span {...listeners} {...attributes} tabIndex={disabled ? -1 : 0}>
      <ButtonFunction disabled={disabled} size='m' icon={<DragIndicatorSVG />} />
    </span>
  );
}
