import { Profile } from '#entities/request-profile/types';

function omitProfileId<T extends { id: string }>(profile: T): Omit<T, 'id'> {
  const copy: Omit<T, 'id'> & { id?: string } = { ...profile };
  delete copy.id;
  return copy;
}

export function serializeProfilesForExport(profiles: Profile[], selectedProfileIds: string[]) {
  return profiles
    .filter(profile => selectedProfileIds.includes(profile.id))
    .map(profile => {
      const { requestHeaders, requestCookies, urlFilters, responseOverrides, ...profileWithoutLists } = profile;

      return {
        ...omitProfileId(profileWithoutLists),
        requestHeaders: requestHeaders.map(header => ({
          name: header.name,
          value: header.value,
          disabled: header.disabled,
        })),
        requestCookies: (requestCookies ?? []).map(cookie => ({
          name: cookie.name,
          value: cookie.value,
          disabled: cookie.disabled,
        })),
        urlFilters: (urlFilters ?? []).map(filter => ({
          value: filter.value,
          disabled: filter.disabled,
        })),
        responseOverrides: (responseOverrides ?? []).map(override => ({
          name: override.name,
          matchType: override.matchType,
          url: override.url,
          method: override.method,
          statusCode: override.statusCode,
          responseBody: override.responseBody,
          disabled: override.disabled,
        })),
      };
    });
}
