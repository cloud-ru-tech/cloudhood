export type RequestHeader = {
  id: number;
  name: string;
  value: string;
  disabled: boolean;
  urlFilters: string[];
};

export type Profile = { id: string; name?: string; requestHeaders: RequestHeader[] };

export type RemoveHeaderPayload = {
  headerId: number;
};
