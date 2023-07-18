import { AddHeaderPayload, Profiles, RemoveHeaderPayload, RequestHeader } from '#entities/request-profile/types';
import { generateId } from '#shared/utils/generateId';

type CRUDParams = {
  profiles: { map: Profiles };
  selectedProfile: string;
};

export function updateProfileHeadersApi({ profiles, selectedProfile }: CRUDParams, updatedHeaders: RequestHeader[]) {
  const { map } = profiles;
  let headers = map.get(selectedProfile);

  if (headers) {
    headers = headers.map(header => {
      const updatedHeader = updatedHeaders?.find(h => h.id === header.id);
      if (updatedHeader) {
        return updatedHeader;
      }

      return header;
    });

    map.set(selectedProfile, headers);
  }

  return { map };
}

export function addProfileHeadersApi({ profiles, selectedProfile }: CRUDParams, newHeaders: AddHeaderPayload[]) {
  const { map } = profiles;

  map.set(selectedProfile, [...(map.get(selectedProfile) ?? []), ...newHeaders.map(h => ({ ...h, id: generateId() }))]);

  return { map };
}

export function addProfileApi({ profiles }: Pick<CRUDParams, 'profiles'>) {
  const { map } = profiles;

  const addedHeaderId = generateId().toString();

  map.set(addedHeaderId, [{ id: generateId(), name: '', value: '', disabled: false }]);

  return {
    profiles: { map },
    addedHeaderId,
  };
}

export function removeProfileHeadersApi({ profiles, selectedProfile }: CRUDParams, headers: RemoveHeaderPayload[]) {
  const { map } = profiles;

  const headersId = headers.map(h => h.headerId);

  map.set(selectedProfile, map.get(selectedProfile)?.filter(h => !headersId.includes(h.id)) ?? []);

  return { map };
}

export function removeSelectedProfileApi({ profiles, selectedProfile }: CRUDParams) {
  const { map } = profiles;

  if (Array.from(map.keys()).length === 1) throw new Error();

  map.delete(selectedProfile);

  return { map };
}
