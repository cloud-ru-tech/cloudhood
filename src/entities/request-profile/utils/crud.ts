import { AddHeaderPayload, Profiles, RemoveHeaderPayload, RequestHeader } from '#entities/request-header/types';
import { generateId } from '#shared/utils/generateId';

type CRUDParams = {
  profiles: Profiles;
  selectedProfile: string;
};

export function updateProfileHeadersApi({ profiles, selectedProfile }: CRUDParams, updatedHeaders: RequestHeader[]) {
  const updatedProfiles: Profiles = JSON.parse(JSON.stringify(profiles));
  const headers = updatedProfiles[selectedProfile];

  if (headers) {
    updatedHeaders.forEach(newHeader => {
      const index = headers.findIndex(h => h.id === newHeader.id);
      if (index !== -1) {
        headers[index] = newHeader;
      }
    });
  }

  return updatedProfiles;
}

export function addProfileHeadersApi({ profiles, selectedProfile }: CRUDParams, newHeaders: AddHeaderPayload[]) {
  const updatedProfiles: Profiles = JSON.parse(JSON.stringify(profiles));

  updatedProfiles[selectedProfile].push(...newHeaders.map(h => ({ ...h, id: generateId() })));

  return updatedProfiles;
}

export function addProfileApi({ profiles }: Pick<CRUDParams, 'profiles'>) {
  const updatedProfiles: Profiles = JSON.parse(JSON.stringify(profiles));
  updatedProfiles[generateId().toString()] = [{ id: generateId(), name: '', value: '', disabled: false }];

  return updatedProfiles;
}

export function removeProfileHeadersApi({ profiles, selectedProfile }: CRUDParams, headers: RemoveHeaderPayload[]) {
  const updatedProfiles: Profiles = JSON.parse(JSON.stringify(profiles));
  const headersId = headers.map(h => h.headerId);

  updatedProfiles[selectedProfile] = updatedProfiles[selectedProfile].filter(h => !headersId.includes(h.id));

  return updatedProfiles;
}

export function removeSelectedProfileApi({ profiles, selectedProfile }: CRUDParams) {
  if (Object.keys(profiles).length === 1) throw new Error();

  const updatedProfiles: Profiles = JSON.parse(JSON.stringify(profiles));

  delete updatedProfiles[selectedProfile];

  return updatedProfiles;
}
