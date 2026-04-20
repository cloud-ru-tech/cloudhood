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

export type Profile = {
  id: string;
  name?: string;
  requestHeaders: RequestHeader[];
  requestCookies: RequestCookie[];
  urlFilters: UrlFilter[];
};

export type RemoveHeaderPayload = {
  headerId: number;
};
