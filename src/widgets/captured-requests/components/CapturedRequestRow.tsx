import { memo } from 'react';

import { ButtonSimple } from '@snack-uikit/button';

import { CAPTURED_REQUESTS_COPY } from '#shared/constants';
import { CapturedRequest } from '#shared/types/capturedRequest';
import { formatCapturedRequestStatus, formatCapturedRequestUrlDisplay } from '#shared/utils/capturedRequests';

import * as S from '../styled';

type CapturedRequestRowProps = {
  request: CapturedRequest;
  pageUrl?: string | null;
  onMock: (requestId: string) => void;
};

export const CapturedRequestRow = memo(function CapturedRequestRow({
  request,
  pageUrl,
  onMock,
}: CapturedRequestRowProps) {
  const statusLabel = formatCapturedRequestStatus(request);
  const displayUrl = formatCapturedRequestUrlDisplay(request.url, pageUrl);

  return (
    <S.Row data-test-id='captured-request-row' data-request-id={request.id}>
      <S.Method data-test-id='captured-request-method'>{request.method}</S.Method>
      <S.Status data-test-id='captured-request-status'>{statusLabel ?? ''}</S.Status>
      <S.Url data-test-id='captured-request-url'>
        <S.UrlText text={displayUrl} maxLines={1} />
      </S.Url>
      <S.MockAction>
        <ButtonSimple
          size='xs'
          appearance='neutral'
          label={CAPTURED_REQUESTS_COPY.mock}
          onClick={() => onMock(request.id)}
          data-test-id='captured-request-mock'
        />
      </S.MockAction>
    </S.Row>
  );
});
