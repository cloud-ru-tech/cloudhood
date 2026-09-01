import { PointerEvent, useRef } from 'react';

import { POPUP_COPY } from '#shared/constants';
import { applyPopupSize, readAppliedPopupSize } from '#shared/utils/popupSize';
import { savePopupSize } from '#shared/utils/popupSizeStorage';

import * as S from './PopupResizeHandle.styled';

type DragOrigin = {
  pointerId: number;
  startClientX: number;
  startClientY: number;
  startHeight: number;
};

function nextSizeFromPointer(dragOrigin: DragOrigin, clientX: number, clientY: number) {
  return {
    width: document.documentElement.clientWidth - clientX + dragOrigin.startClientX,
    height: dragOrigin.startHeight + (clientY - dragOrigin.startClientY),
  };
}

export function PopupResizeHandle() {
  const dragOriginRef = useRef<DragOrigin | null>(null);
  const frameRef = useRef(0);

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);

    const currentSize = readAppliedPopupSize();
    dragOriginRef.current = {
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startHeight: currentSize.height,
    };
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const dragOrigin = dragOriginRef.current;

    if (!dragOrigin || dragOrigin.pointerId !== event.pointerId) {
      return;
    }

    const nextSize = nextSizeFromPointer(dragOrigin, event.clientX, event.clientY);

    if (frameRef.current !== 0) {
      cancelAnimationFrame(frameRef.current);
    }

    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = 0;
      applyPopupSize(nextSize);
    });
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const dragOrigin = dragOriginRef.current;

    if (!dragOrigin || dragOrigin.pointerId !== event.pointerId) {
      return;
    }

    dragOriginRef.current = null;

    if (frameRef.current !== 0) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = 0;
    }

    applyPopupSize(nextSizeFromPointer(dragOrigin, event.clientX, event.clientY));

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    savePopupSize(readAppliedPopupSize()).catch(() => undefined);
  };

  return (
    <S.Handle
      role='slider'
      aria-label={POPUP_COPY.resizeHandle}
      aria-orientation='horizontal'
      data-test-id='popup-resize-handle'
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    />
  );
}
