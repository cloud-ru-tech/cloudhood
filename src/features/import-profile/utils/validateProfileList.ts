import { Profile, RequestCookie, RequestHeader } from '#entities/request-profile/types';
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

    if (profile.requestCookies !== undefined && !Array.isArray(profile.requestCookies)) {
      throw new Error(`The profile ${currentProfileNumber} "requestCookies" value must be an array`);
    }

    (profile.requestCookies ?? []).forEach((cookie: Partial<RequestCookie>, cookieIndex: number) => {
      const currentCookieNumber = cookieIndex + 1;

      if (typeof cookie.name !== 'string') {
        throw new Error(
          `The cookie ${currentCookieNumber} in profile ${currentProfileNumber} must have a string "name" value`,
        );
      }

      if (typeof cookie.value !== 'string') {
        throw new Error(
          `The cookie ${currentCookieNumber} in profile ${currentProfileNumber} must have a string "value" value`,
        );
      }

      if (typeof cookie.disabled !== 'boolean') {
        throw new Error(
          `The cookie ${currentCookieNumber} in profile ${currentProfileNumber} must have a boolean "disabled" value`,
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
  const existingProfileRequestCookiesListId = existingProfileList.flatMap(profile =>
    (profile.requestCookies ?? []).map(cookie => cookie.id),
  );

  return profileList.map(profile => ({
    ...profile,
    id: generateIdWithExcludeList(existingProfileListId).toString(),
    requestHeaders: profile.requestHeaders.map((header: RequestHeader) => ({
      ...header,
      id: generateIdWithExcludeList(existingProfileRequestHeadersListId),
    })),
    requestCookies: (profile.requestCookies ?? []).map((cookie: RequestCookie) => ({
      ...cookie,
      id: generateIdWithExcludeList(existingProfileRequestCookiesListId),
    })),
    urlFilters: profile.urlFilters || [],
  }));
}
