import { allSettled, createEvent, createStore, fork } from 'effector';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock dependencies before imports
vi.mock('#entities/request-profile/model', () => ({
  $requestProfiles: createStore([]),
  $selectedRequestProfile: createStore(''),
  profileUpdated: createEvent(),
}));

vi.mock('#shared/utils/generateId', () => ({
  generateId: vi.fn(() => 12345),
}));

// Import the module under test
import { $requestProfiles, $selectedRequestProfile, profileUpdated } from '#entities/request-profile/model';
import { Profile } from '#entities/request-profile/types';
import { generateId } from '#shared/utils/generateId';

import { profileUrlFiltersAdded } from '../model';

describe('profileUrlFiltersAdded', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should add new urlFilter to profile with existing urlFilters', async () => {
    // Arrange
    const mockProfiles = [
      {
        id: 'profile1',
        name: 'Test Profile',
        requestHeaders: [],
        urlFilters: [{ id: 1, value: 'existing-filter', disabled: false }],
      },
    ];

    const profileUpdatedSpy = vi.fn();
    profileUpdated.watch(profileUpdatedSpy);

    const scope = fork({
      values: [
        [$requestProfiles, mockProfiles],
        [$selectedRequestProfile, 'profile1'],
      ],
    });

    // Act
    await allSettled(profileUrlFiltersAdded, { scope });

    // Assert
    expect(generateId).toHaveBeenCalled();
    expect(profileUpdatedSpy).toHaveBeenCalledWith({
      id: 'profile1',
      name: 'Test Profile',
      requestHeaders: [],
      urlFilters: [
        { id: 1, value: 'existing-filter', disabled: false },
        { id: 12345, value: '', disabled: false },
      ],
    });
  });

  it('should add new urlFilter to profile without urlFilters (legacy data)', async () => {
    // Arrange - profile without urlFilters as in legacy data
    const mockProfiles: Partial<Profile>[] = [
      {
        id: 'profile1',
        name: 'bulk',
        requestHeaders: [{ id: 1, disabled: true, name: 'cp-front-container', value: 'HCE-164' }],
        // urlFilters intentionally omitted to simulate undefined
      },
    ];

    const profileUpdatedSpy = vi.fn();
    profileUpdated.watch(profileUpdatedSpy);

    const scope = fork({
      values: [
        [$requestProfiles, mockProfiles],
        [$selectedRequestProfile, 'profile1'],
      ],
    });

    // Act
    await allSettled(profileUrlFiltersAdded, { scope });

    // Assert
    expect(generateId).toHaveBeenCalled();
    expect(profileUpdatedSpy).toHaveBeenCalledWith({
      id: 'profile1',
      name: 'bulk',
      requestHeaders: [{ id: 1, disabled: true, name: 'cp-front-container', value: 'HCE-164' }],
      urlFilters: [{ id: 12345, value: '', disabled: false }],
    });
  });

  it('should handle profile with undefined urlFilters', async () => {
    // Arrange
    const mockProfiles: Partial<Profile>[] = [
      {
        id: 'profile1',
        name: 'Test Profile',
        requestHeaders: [],
        // urlFilters intentionally omitted to simulate undefined
      },
    ];

    const profileUpdatedSpy = vi.fn();
    profileUpdated.watch(profileUpdatedSpy);

    const scope = fork({
      values: [
        [$requestProfiles, mockProfiles],
        [$selectedRequestProfile, 'profile1'],
      ],
    });

    // Act
    await allSettled(profileUrlFiltersAdded, { scope });

    // Assert
    expect(profileUpdatedSpy).toHaveBeenCalledWith({
      id: 'profile1',
      name: 'Test Profile',
      requestHeaders: [],
      urlFilters: [{ id: 12345, value: '', disabled: false }],
    });
  });
});
