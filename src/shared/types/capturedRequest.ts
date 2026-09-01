import type { ResponseOverrideHttpMethod } from '#shared/types/responseOverride';

export type CapturedRequestState = 'pending' | 'completed' | 'failed';

export type CapturedRequest = {
  id: string;
  url: string;
  method: ResponseOverrideHttpMethod;
  state: CapturedRequestState;
  statusCode: number | null;
  responseBody: string | null;
  startedAt: number;
};

export type CapturedRequestsTabRecord = {
  entries: CapturedRequest[];
};

export type CapturedRequestStartedEvent = {
  kind: 'started';
  id: string;
  url: string;
  method: ResponseOverrideHttpMethod;
  startedAt: number;
};

export type CapturedRequestSettledEvent = {
  kind: 'settled';
  id: string;
  statusCode: number | null;
  responseBody: string | null;
};

export type CapturedRequestFailedEvent = {
  kind: 'failed';
  id: string;
};

export type CapturedRequestEvent =
  | CapturedRequestStartedEvent
  | CapturedRequestSettledEvent
  | CapturedRequestFailedEvent;

export type CapturedRequestsViewPhase = 'loading' | 'ready' | 'error';

export type CapturedRequestSearchQuery = {
  urlQuery: string;
  bodyQuery: string;
};

export type CapturedRequestSearchIndexEntry = {
  request: CapturedRequest;
  urlLowerCase: string;
  bodyLowerCase: string | null;
};

export type CapturedRequestsViewState =
  | { type: 'loading' }
  | { type: 'no-active-page' }
  | { type: 'restricted' }
  | { type: 'empty' }
  | { type: 'no-matches' }
  | { type: 'error' }
  | { type: 'list'; entries: CapturedRequest[] };

export type TargetTabCandidate = {
  id?: number;
  url?: string;
};
