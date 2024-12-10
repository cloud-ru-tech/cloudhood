import { useSortable } from '@dnd-kit/sortable';

import { ButtonFunction } from '@snack-uikit/button';

import { DragIndicatorSVG } from '#shared/assets/svg';

type DragHandleProps = {
  listeners: ReturnType<typeof useSortable>['listeners'];
  attributes: ReturnType<typeof useSortable>['attributes'];
};

export function DragHandle({ listeners, attributes }: DragHandleProps) {
  return (
    <span {...listeners} {...attributes}>
      <ButtonFunction size='m' icon={<DragIndicatorSVG />} />
    </span>
  );
}
