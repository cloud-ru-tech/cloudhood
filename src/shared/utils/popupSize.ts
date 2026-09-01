import {
  POPUP_DEFAULT_HEIGHT,
  POPUP_DEFAULT_WIDTH,
  POPUP_HOST_MAX_HEIGHT,
  POPUP_HOST_MAX_WIDTH,
  POPUP_MAX_SCREEN_RATIO,
  POPUP_MIN_HEIGHT,
  POPUP_MIN_WIDTH,
} from '#shared/constants';

export type PopupSize = {
  width: number;
  height: number;
};

export const DEFAULT_POPUP_SIZE: PopupSize = {
  width: POPUP_DEFAULT_WIDTH,
  height: POPUP_DEFAULT_HEIGHT,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isFiniteInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && Number.isFinite(value);
}

function readPositiveDimension(value: number | undefined, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    return fallback;
  }

  return value;
}

export function getPopupMaxSize(screenSize?: PopupSize): PopupSize {
  const screenWidth = readPositiveDimension(screenSize?.width ?? window.screen.availWidth, POPUP_DEFAULT_WIDTH);
  const screenHeight = readPositiveDimension(screenSize?.height ?? window.screen.availHeight, POPUP_DEFAULT_HEIGHT);

  return {
    width: Math.min(
      POPUP_HOST_MAX_WIDTH,
      Math.max(POPUP_DEFAULT_WIDTH, Math.floor(screenWidth * POPUP_MAX_SCREEN_RATIO)),
    ),
    height: Math.min(
      POPUP_HOST_MAX_HEIGHT,
      Math.max(POPUP_DEFAULT_HEIGHT, Math.floor(screenHeight * POPUP_MAX_SCREEN_RATIO)),
    ),
  };
}

export function clampPopupSize(size: PopupSize, screenSize?: PopupSize): PopupSize {
  const maxSize = getPopupMaxSize(screenSize);

  return {
    width: Math.min(maxSize.width, Math.max(POPUP_MIN_WIDTH, size.width)),
    height: Math.min(maxSize.height, Math.max(POPUP_MIN_HEIGHT, size.height)),
  };
}

export function parsePopupSize(value: unknown, screenSize?: PopupSize): PopupSize | null {
  if (!isRecord(value) || !isFiniteInteger(value.width) || !isFiniteInteger(value.height)) {
    return null;
  }

  return clampPopupSize({ width: value.width, height: value.height }, screenSize);
}

export function applyPopupSize(size: PopupSize, screenSize?: PopupSize): PopupSize {
  const nextSize = clampPopupSize(size, screenSize);
  const width = `${nextSize.width}px`;
  const height = `${nextSize.height}px`;

  if (
    document.documentElement.style.width === width &&
    document.documentElement.style.height === height &&
    document.body.style.width === width &&
    document.body.style.height === height
  ) {
    return nextSize;
  }

  document.documentElement.style.width = width;
  document.documentElement.style.height = height;
  document.body.style.width = width;
  document.body.style.height = height;
  window.scrollTo(0, 0);

  return nextSize;
}

export function readAppliedPopupSize(screenSize?: PopupSize): PopupSize {
  return clampPopupSize(
    {
      width: document.body.clientWidth,
      height: document.body.clientHeight,
    },
    screenSize,
  );
}
