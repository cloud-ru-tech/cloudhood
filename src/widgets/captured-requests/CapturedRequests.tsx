import { useUnit } from 'effector-react';
import { UIEvent, useEffect, useLayoutEffect, useRef } from 'react';

import { ButtonFilled } from '@snack-uikit/button';
import { FieldText } from '@snack-uikit/fields';

import {
  $capturedRequestsBodySearchQuery,
  $capturedRequestsScrollTop,
  $capturedRequestsUrlSearchQuery,
  $capturedRequestsViewState,
  capturedRequestsBodySearchChanged,
  capturedRequestsRetryRequested,
  capturedRequestsScrollPositionChanged,
  capturedRequestsUrlSearchChanged,
} from '#entities/captured-requests';
import { mockRequestSelected } from '#features/mock-captured-request';
import { CAPTURED_REQUESTS_COPY } from '#shared/constants';

import { CapturedRequestRow } from './components/CapturedRequestRow';
import * as S from './styled';

export function CapturedRequests() {
  const [
    viewState,
    scrollTop,
    urlQuery,
    bodyQuery,
    onRetry,
    onScrollPositionChanged,
    onUrlSearchChanged,
    onBodySearchChanged,
    onMock,
  ] = useUnit([
    $capturedRequestsViewState,
    $capturedRequestsScrollTop,
    $capturedRequestsUrlSearchQuery,
    $capturedRequestsBodySearchQuery,
    capturedRequestsRetryRequested,
    capturedRequestsScrollPositionChanged,
    capturedRequestsUrlSearchChanged,
    capturedRequestsBodySearchChanged,
    mockRequestSelected,
  ]);
  const listRef = useRef<HTMLDivElement>(null);
  const previousScrollHeightRef = useRef(0);

  useEffect(() => {
    if (viewState.type !== 'list' || !listRef.current) {
      return;
    }

    listRef.current.scrollTop = scrollTop;
  }, [scrollTop, viewState.type]);

  useLayoutEffect(() => {
    const listElement = listRef.current;

    if (!listElement || viewState.type !== 'list') {
      return;
    }

    const previousScrollHeight = previousScrollHeightRef.current;
    const nextScrollHeight = listElement.scrollHeight;

    if (previousScrollHeight > 0 && nextScrollHeight > previousScrollHeight && listElement.scrollTop > 0) {
      const nextScrollTop = listElement.scrollTop + (nextScrollHeight - previousScrollHeight);
      listElement.scrollTop = nextScrollTop;
      onScrollPositionChanged(nextScrollTop);
    }

    previousScrollHeightRef.current = nextScrollHeight;
  }, [onScrollPositionChanged, viewState]);

  const handleListScroll = (event: UIEvent<HTMLDivElement>) => {
    onScrollPositionChanged(event.currentTarget.scrollTop);
  };

  if (viewState.type === 'loading') {
    return (
      <S.Wrapper data-test-id='captured-requests-root'>
        <S.StateScreen data-test-id='captured-requests-loading'>
          <S.Spinner />
          <S.StateBody>{CAPTURED_REQUESTS_COPY.loading}</S.StateBody>
        </S.StateScreen>
      </S.Wrapper>
    );
  }

  if (viewState.type === 'no-active-page') {
    return (
      <S.Wrapper data-test-id='captured-requests-root'>
        <S.StateScreen data-test-id='captured-requests-no-page'>
          <S.StateBody>{CAPTURED_REQUESTS_COPY.noActivePage}</S.StateBody>
        </S.StateScreen>
      </S.Wrapper>
    );
  }

  if (viewState.type === 'restricted') {
    return (
      <S.Wrapper data-test-id='captured-requests-root'>
        <S.StateScreen data-test-id='captured-requests-restricted'>
          <S.StateTitle>{CAPTURED_REQUESTS_COPY.restrictedTitle}</S.StateTitle>
          <S.StateBody>{CAPTURED_REQUESTS_COPY.restrictedBody}</S.StateBody>
        </S.StateScreen>
      </S.Wrapper>
    );
  }

  if (viewState.type === 'error') {
    return (
      <S.Wrapper data-test-id='captured-requests-root'>
        <S.StateScreen data-test-id='captured-requests-error'>
          <S.StateTitle>{CAPTURED_REQUESTS_COPY.errorTitle}</S.StateTitle>
          <S.StateBody>{CAPTURED_REQUESTS_COPY.errorBody}</S.StateBody>
          <ButtonFilled
            size='s'
            appearance='primary'
            label={CAPTURED_REQUESTS_COPY.retry}
            onClick={onRetry}
            data-test-id='captured-requests-retry'
          />
        </S.StateScreen>
      </S.Wrapper>
    );
  }

  const searchRow = (
    <S.SearchRow data-test-id='captured-requests-search'>
      <S.SearchField>
        <FieldText
          size='s'
          inputMode='text'
          label={CAPTURED_REQUESTS_COPY.searchUrlLabel}
          placeholder={CAPTURED_REQUESTS_COPY.searchUrlPlaceholder}
          value={urlQuery}
          onChange={onUrlSearchChanged}
          data-test-id='captured-requests-search-url'
        />
      </S.SearchField>
      <S.SearchField>
        <FieldText
          size='s'
          inputMode='text'
          label={CAPTURED_REQUESTS_COPY.searchBodyLabel}
          placeholder={CAPTURED_REQUESTS_COPY.searchBodyPlaceholder}
          value={bodyQuery}
          onChange={onBodySearchChanged}
          data-test-id='captured-requests-search-body'
        />
      </S.SearchField>
    </S.SearchRow>
  );

  if (viewState.type === 'empty') {
    return (
      <S.Wrapper data-test-id='captured-requests-root'>
        {searchRow}
        <S.StateScreen data-test-id='captured-requests-empty'>
          <S.StateTitle>{CAPTURED_REQUESTS_COPY.emptyTitle}</S.StateTitle>
          <S.StateBody>{CAPTURED_REQUESTS_COPY.emptyBody}</S.StateBody>
        </S.StateScreen>
      </S.Wrapper>
    );
  }

  if (viewState.type === 'no-matches') {
    return (
      <S.Wrapper data-test-id='captured-requests-root'>
        {searchRow}
        <S.StateScreen data-test-id='captured-requests-no-matches'>
          <S.StateTitle>{CAPTURED_REQUESTS_COPY.noMatchesTitle}</S.StateTitle>
          <S.StateBody>{CAPTURED_REQUESTS_COPY.noMatchesBody}</S.StateBody>
        </S.StateScreen>
      </S.Wrapper>
    );
  }

  return (
    <S.Wrapper data-test-id='captured-requests-root'>
      {searchRow}
      <S.List ref={listRef} data-test-id='captured-requests-list' onScroll={handleListScroll}>
        {viewState.entries.map(request => (
          <CapturedRequestRow key={request.id} request={request} onMock={onMock} />
        ))}
      </S.List>
    </S.Wrapper>
  );
}
