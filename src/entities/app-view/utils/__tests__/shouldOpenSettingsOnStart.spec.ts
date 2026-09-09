import { describe, expect, it } from 'vitest';

import { shouldOpenSettingsOnStart } from '../shouldOpenSettingsOnStart';

describe('shouldOpenSettingsOnStart', () => {
  it('opens settings for the native options page', () => {
    expect(
      shouldOpenSettingsOnStart({
        pathname: '/options.html',
        search: '',
        hash: '',
      }),
    ).toBe(true);
  });

  it('opens settings when view=settings is present', () => {
    expect(
      shouldOpenSettingsOnStart({
        pathname: '/popup.html',
        search: '?view=settings',
        hash: '',
      }),
    ).toBe(true);
  });

  it('opens settings when the settings hash is present', () => {
    expect(
      shouldOpenSettingsOnStart({
        pathname: '/popup.html',
        search: '',
        hash: '#settings',
      }),
    ).toBe(true);
  });

  it('keeps the main view for the popup', () => {
    expect(
      shouldOpenSettingsOnStart({
        pathname: '/popup.html',
        search: '',
        hash: '',
      }),
    ).toBe(false);
  });
});
