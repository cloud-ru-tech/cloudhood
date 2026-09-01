import { afterEach, describe, expect, it } from 'vitest';

import { POPUP_HOST_MAX_HEIGHT, POPUP_HOST_MAX_WIDTH, POPUP_MIN_HEIGHT, POPUP_MIN_WIDTH } from '#shared/constants';
import { applyPopupSize, clampPopupSize, getPopupMaxSize, parsePopupSize } from '#shared/utils/popupSize';

const largeScreenSize = { width: 2000, height: 1000 };
const smallScreenSize = { width: 1000, height: 700 };

describe('getPopupMaxSize', () => {
  it('caps at the browser action-popup host limit on large screens', () => {
    expect(getPopupMaxSize(largeScreenSize)).toEqual({
      width: POPUP_HOST_MAX_WIDTH,
      height: POPUP_HOST_MAX_HEIGHT,
    });
  });

  it('uses 80 percent of the screen when that is smaller than the host limit', () => {
    expect(getPopupMaxSize(smallScreenSize)).toEqual({ width: 800, height: 560 });
  });

  it('never shrinks the default popup size when the screen is small', () => {
    expect(getPopupMaxSize({ width: 600, height: 600 })).toEqual({
      width: 630,
      height: 492,
    });
  });
});

describe('clampPopupSize', () => {
  it('keeps sizes between the minimum and the reserved host maximum', () => {
    expect(clampPopupSize({ width: 640, height: 480 }, largeScreenSize)).toEqual({ width: 640, height: 480 });
    expect(clampPopupSize({ width: 200, height: 100 }, largeScreenSize)).toEqual({
      width: POPUP_MIN_WIDTH,
      height: POPUP_MIN_HEIGHT,
    });
    expect(clampPopupSize({ width: 1800, height: 900 }, largeScreenSize)).toEqual({
      width: POPUP_HOST_MAX_WIDTH,
      height: POPUP_HOST_MAX_HEIGHT,
    });
  });
});

describe('parsePopupSize', () => {
  it('accepts integer width and height', () => {
    expect(parsePopupSize({ width: 640, height: 480 }, largeScreenSize)).toEqual({ width: 640, height: 480 });
  });

  it('rejects invalid payloads', () => {
    expect(parsePopupSize(null)).toBeNull();
    expect(parsePopupSize({ width: 640 })).toBeNull();
    expect(parsePopupSize({ width: 640.5, height: 480 })).toBeNull();
    expect(parsePopupSize({ width: '640', height: 480 })).toBeNull();
  });
});

describe('applyPopupSize', () => {
  afterEach(() => {
    document.documentElement.style.width = '';
    document.documentElement.style.height = '';
    document.body.style.width = '';
    document.body.style.height = '';
  });

  it('writes clamped dimensions onto html and body', () => {
    const nextSize = applyPopupSize({ width: 640, height: 480 }, largeScreenSize);

    expect(nextSize).toEqual({ width: 640, height: 480 });
    expect(document.documentElement.style.width).toBe('640px');
    expect(document.documentElement.style.height).toBe('480px');
    expect(document.body.style.width).toBe('640px');
    expect(document.body.style.height).toBe('480px');
  });
});
