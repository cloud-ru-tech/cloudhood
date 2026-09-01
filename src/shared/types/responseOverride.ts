export enum ResponseOverrideMatchType {
  Contains = 'contains',
  Equals = 'equals',
  Regex = 'regex',
}

export type ResponseOverrideHttpMethod =
  | 'GET'
  | 'HEAD'
  | 'POST'
  | 'PUT'
  | 'DELETE'
  | 'CONNECT'
  | 'OPTIONS'
  | 'TRACE';

export type ResponseOverride = {
  id: number;
  name: string;
  matchType: ResponseOverrideMatchType;
  url: string;
  method: ResponseOverrideHttpMethod;
  statusCode: number;
  responseBody: string;
  disabled: boolean;
};
