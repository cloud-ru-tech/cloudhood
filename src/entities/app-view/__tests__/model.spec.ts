import { allSettled, fork } from 'effector';
import { describe, expect, it } from 'vitest';

import { $appView, settingsClosed, settingsOpened, settingsToggled } from '../model';

describe('app-view', () => {
  it('opens, closes and toggles the settings view', async () => {
    const scope = fork();

    expect(scope.getState($appView)).toBe('main');

    await allSettled(settingsOpened, { scope });
    expect(scope.getState($appView)).toBe('settings');

    await allSettled(settingsClosed, { scope });
    expect(scope.getState($appView)).toBe('main');

    await allSettled(settingsToggled, { scope });
    expect(scope.getState($appView)).toBe('settings');

    await allSettled(settingsToggled, { scope });
    expect(scope.getState($appView)).toBe('main');
  });
});
