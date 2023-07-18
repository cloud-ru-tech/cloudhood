export type RequestHeader = {
  id: number;
  name: string;
  value: string;
  disabled: boolean;
};

export type Profiles = Map<string, RequestHeader[]>;

export type RemoveHeaderPayload = {
  headerId: number;
};

export type AddHeaderPayload = Omit<RequestHeader, 'id'>;
