import { useSortable } from '@dnd-kit/sortable';
import { DragIndicator } from '@mui/icons-material';
import { ButtonFunction } from '@snack-uikit/button';

type DragHandleProps = {
  listeners: ReturnType<typeof useSortable>['listeners'];
  attributes: ReturnType<typeof useSortable>['attributes'];
};

export function DragHandle({ listeners, attributes }: DragHandleProps) {
  return (
    <span {...listeners} {...attributes}>
      <ButtonFunction size='m' icon={<DragIndicator />} />
    </span>
  );
}
