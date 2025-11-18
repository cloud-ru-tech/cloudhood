import { Profile, RequestHeader } from '#entities/request-profile/types';
import { generateIdWithExcludeList } from '#shared/utils/generateId';

export function validateProfileList(profileList: Profile[], existingProfileList: Profile[]) {
  if (!Array.isArray(profileList) || !profileList.length) {
    throw new Error('JSON must be an array and have at least one object');
  }

  profileList.forEach((profile, profileIndex) => {
    const currentProfileNumber = profileIndex + 1;

    if (!profile.id || typeof profile.id !== 'string') {
      throw new Error(`The profile ${currentProfileNumber} must have a string id value`);
    }

    if (!profile.requestHeaders || !Array.isArray(profile.requestHeaders)) {
      throw new Error(`The profile ${currentProfileNumber} must have at least one header`);
    }

    profile.requestHeaders.forEach((header: Partial<RequestHeader>, headerIndex: number) => {
      const currentHeaderNumber = headerIndex + 1;

      if (typeof header.id !== 'number') {
        throw new Error(
          `The header ${currentHeaderNumber} in profile ${currentProfileNumber} must have a numeric "id" value`,
        );
      }

      if (typeof header.name !== 'string') {
        throw new Error(
          `The header ${currentHeaderNumber} in profile ${currentProfileNumber} must have a string "name" value`,
        );
      }

      if (typeof header.value !== 'string') {
        throw new Error(
          `The header ${currentHeaderNumber} in profile ${currentProfileNumber} must have a string "value" value`,
        );
      }

      if (typeof header.disabled !== 'boolean') {
        throw new Error(
          `The header ${currentHeaderNumber} in profile ${currentProfileNumber} must have a boolean "disabled" value`,
        );
      }
    });

    existingProfileList.forEach((existingProfile, existingProfileIndex) => {
      const currentExistingProfileNumber = existingProfileIndex + 1;

      if (existingProfile.id === profile.id) {
        throw new Error(
          `The new profile ${currentProfileNumber} cannot have the same id as profile ${currentExistingProfileNumber}`,
        );
      }

      existingProfile.requestHeaders.forEach(existingHeader => {
        profile.requestHeaders.forEach((header: Partial<RequestHeader>, headerIndex: number) => {
          if (existingHeader.id === header.id) {
            throw new Error(
              `The new header ${
                headerIndex + 1
              } in profile ${currentProfileNumber} cannot have the same id as header ${currentExistingProfileNumber}`,
            );
          }
        });
      });
    });
  });
}

export function generateProfileList(profileList: Profile[], existingProfileList: Profile[]) {
  const existingProfileListId = existingProfileList.map(profile => Number(profile.id));
  const existingProfileRequestHeadersListId = existingProfileList.flatMap(profile =>
    profile.requestHeaders.map(header => header.id),
  );

  return profileList.map(profile => ({
    ...profile,
    id: generateIdWithExcludeList(existingProfileListId).toString(),
    requestHeaders: profile.requestHeaders.map((header: RequestHeader) => ({
      ...header,
      id: generateIdWithExcludeList(existingProfileRequestHeadersListId),
    })),
    urlFilters: profile.urlFilters || [],
    responseOverrides: (profile.responseOverrides || []).map(override => ({
      ...override,
      id: generateIdWithExcludeList(existingProfileRequestHeadersListId),
    })),
  }));
}
