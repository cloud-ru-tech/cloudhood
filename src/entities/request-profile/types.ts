import type { ResponseOverride } from '#shared/types/responseOverride';

export type RequestHeader = {
  id: number;
  name: string;
  value: string;
  disabled: boolean;
};

export type RequestCookie = {
  id: number;
  name: string;
  value: string;
  disabled: boolean;
};

export type UrlFilter = {
  id: number;
  value: string;
  disabled: boolean;
};

export {
  ResponseOverrideMatchType,
  type ResponseOverrideHttpMethod,
  type ResponseOverride,
} from '#shared/types/responseOverride';

export type Profile = {
  id: string;
  name?: string;
  requestHeaders: RequestHeader[];
  requestCookies: RequestCookie[];
  urlFilters: UrlFilter[];
  responseOverrides?: ResponseOverride[];
  responseOverridesDisabled?: boolean;
};

export type RemoveHeaderPayload = {
  headerId: number;
};
