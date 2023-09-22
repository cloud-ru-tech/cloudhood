import { useSortable } from '@dnd-kit/sortable';
import { DragIndicator } from '@mui/icons-material';
import { IconButton } from '@mui/material';

type DragHandleProps = {
  listeners: ReturnType<typeof useSortable>['listeners'];
  attributes: ReturnType<typeof useSortable>['attributes'];
};

export function DragHandle({ listeners, attributes }: DragHandleProps) {
  return (
    <IconButton {...listeners} {...attributes}>
      <DragIndicator />
    </IconButton>
  );
}
