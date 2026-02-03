import type { Theme } from '../config/screenshot.config';

export const getSnapshotName = (area: string, testName: string, theme: Theme): string =>
  `${area}/${testName}-${theme}.png`;
