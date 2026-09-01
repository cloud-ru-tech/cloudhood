import { allSettled, createEvent, createStore, fork } from 'effector';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('#entities/captured-requests/model', () => ({
  $capturedRequestEntries: createStore([]),
}));

vi.mock('#entities/notification/model', () => ({
  notificationAdded: createEvent(),
}));

vi.mock('#entities/profile-actions', () => ({
  profileActionsTabChanged: createEvent(),
}));

vi.mock('#entities/request-profile/model', () => ({
  $requestProfiles: createStore([]),
  $selectedRequestProfile: createStore(''),
  profileUpdated: createEvent(),
}));

vi.mock('#shared/utils/generateId', () => ({
  generateId: vi.fn(() => 4242),
}));

import { $capturedRequestEntries } from '#entities/captured-requests/model';
import { notificationAdded } from '#entities/notification/model';
import { profileActionsTabChanged } from '#entities/profile-actions';
import { $requestProfiles, $selectedRequestProfile, profileUpdated } from '#entities/request-profile/model';
import { Profile, ResponseOverrideMatchType } from '#entities/request-profile/types';
import { CapturedRequest } from '#shared/types/capturedRequest';
import { generateId } from '#shared/utils/generateId';

import { mockedResponseOverrideCreated, mockRequestSelected } from '../model';

const createProfile = (overrides?: Partial<Profile>): Profile => ({
  id: 'profile1',
  name: 'Test Profile',
  requestHeaders: [],
  requestCookies: [],
  urlFilters: [],
  ...overrides,
});

const createCaptured = (overrides?: Partial<CapturedRequest>): CapturedRequest => ({
  id: 'cap-1',
  url: 'https://example.com/api?q=1',
  method: 'POST',
  state: 'completed',
  statusCode: 201,
  responseBody: '{"ok":true}',
  startedAt: 1,
  ...overrides,
});

describe('mockRequestSelected', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('appends a disabled prefilled override, switches tab, reveals, and toasts', async () => {
    const profileUpdatedSpy = vi.fn();
    const tabChangedSpy = vi.fn();
    const revealSpy = vi.fn();
    const notificationSpy = vi.fn();
    profileUpdated.watch(profileUpdatedSpy);
    profileActionsTabChanged.watch(tabChangedSpy);
    mockedResponseOverrideCreated.watch(revealSpy);
    notificationAdded.watch(notificationSpy);

    const existingOverride = {
      id: 1,
      name: 'Response №1',
      matchType: ResponseOverrideMatchType.Equals,
      url: 'https://example.com/api?q=1',
      method: 'POST' as const,
      statusCode: 201,
      responseBody: '{}',
      disabled: false,
    };

    const scope = fork({
      values: [
        [$requestProfiles, [createProfile({ responseOverrides: [existingOverride] })]],
        [$selectedRequestProfile, 'profile1'],
        [$capturedRequestEntries, [createCaptured()]],
      ],
    });

    await allSettled(mockRequestSelected, { scope, params: 'cap-1' });

    expect(generateId).toHaveBeenCalled();
    expect(profileUpdatedSpy).toHaveBeenCalledWith({
      id: 'profile1',
      name: 'Test Profile',
      requestHeaders: [],
      requestCookies: [],
      urlFilters: [],
      responseOverrides: [
        existingOverride,
        {
          id: 4242,
          name: 'Response №2',
          matchType: ResponseOverrideMatchType.Equals,
          url: 'https://example.com/api?q=1',
          method: 'POST',
          statusCode: 201,
          responseBody: `${JSON.stringify({ ok: true }, null, 2)}`,
          disabled: true,
        },
      ],
    });
    expect(tabChangedSpy).toHaveBeenCalledWith('response-overrides');
    expect(revealSpy).toHaveBeenCalledWith(4242);
    expect(notificationSpy).toHaveBeenCalledWith({ message: 'Mock created. Review and enable it.' });
  });

  it('appends a second disabled card for a duplicate URL+method instead of editing the existing one', async () => {
    const profileUpdatedSpy = vi.fn();
    profileUpdated.watch(profileUpdatedSpy);

    const existingOverride = {
      id: 7,
      name: 'Response №1',
      matchType: ResponseOverrideMatchType.Equals,
      url: 'https://example.com/api?q=1',
      method: 'POST' as const,
      statusCode: 200,
      responseBody: '{}',
      disabled: false,
    };

    const scope = fork({
      values: [
        [$requestProfiles, [createProfile({ responseOverrides: [existingOverride] })]],
        [$selectedRequestProfile, 'profile1'],
        [$capturedRequestEntries, [createCaptured()]],
      ],
    });

    await allSettled(mockRequestSelected, { scope, params: 'cap-1' });

    expect(profileUpdatedSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        responseOverrides: [existingOverride, expect.objectContaining({ id: 4242, disabled: true })],
      }),
    );
  });

  it('mocks a filtered row by id with the same disabled prefill', async () => {
    const profileUpdatedSpy = vi.fn();
    const tabChangedSpy = vi.fn();
    const notificationSpy = vi.fn();
    profileUpdated.watch(profileUpdatedSpy);
    profileActionsTabChanged.watch(tabChangedSpy);
    notificationAdded.watch(notificationSpy);

    const filteredOut = createCaptured({
      id: 'cap-hidden',
      url: 'https://other.example.com/hidden',
      method: 'GET',
      statusCode: 200,
      responseBody: '{"hidden":true}',
    });

    const scope = fork({
      values: [
        [$requestProfiles, [createProfile()]],
        [$selectedRequestProfile, 'profile1'],
        [$capturedRequestEntries, [filteredOut, createCaptured()]],
      ],
    });

    await allSettled(mockRequestSelected, { scope, params: 'cap-1' });

    expect(profileUpdatedSpy).toHaveBeenCalledWith({
      id: 'profile1',
      name: 'Test Profile',
      requestHeaders: [],
      requestCookies: [],
      urlFilters: [],
      responseOverrides: [
        {
          id: 4242,
          name: 'Response №1',
          matchType: ResponseOverrideMatchType.Equals,
          url: 'https://example.com/api?q=1',
          method: 'POST',
          statusCode: 201,
          responseBody: `${JSON.stringify({ ok: true }, null, 2)}`,
          disabled: true,
        },
      ],
    });
    expect(tabChangedSpy).toHaveBeenCalledWith('response-overrides');
    expect(notificationSpy).toHaveBeenCalledWith({ message: 'Mock created. Review and enable it.' });
  });
});
