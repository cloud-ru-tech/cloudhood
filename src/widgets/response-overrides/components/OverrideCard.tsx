import { useUnit } from 'effector-react';
import { KeyboardEvent, useEffect, useState } from 'react';

import { ButtonFunction } from '@snack-uikit/button';
import { FieldDecorator, FieldSelect, FieldText } from '@snack-uikit/fields';
import { CheckSVG, ChevronDownSVG, ChevronUpSVG, CrossSVG } from '@snack-uikit/icons';
import { Checkbox } from '@snack-uikit/toggles';

import { $isPaused } from '#entities/is-paused/model';
import type { ResponseOverride } from '#entities/request-profile/types';
import { selectedProfileResponseOverridesRemoved } from '#features/selected-profile-response-overrides/remove/model';
import { selectedProfileResponseOverrideToggled } from '#features/selected-profile-response-overrides/toggle/model';
import { selectedProfileResponseOverridesUpdated } from '#features/selected-profile-response-overrides/update/model';
import { EditSVG } from '#shared/assets/svg';
import {
  RESPONSE_OVERRIDE_COPY,
  RESPONSE_OVERRIDE_HTTP_METHODS,
  RESPONSE_OVERRIDE_STATUS_CODES,
} from '#shared/constants';
import { ResponseOverrideMatchType } from '#shared/types/responseOverride';
import {
  formatStatusOption,
  getOverrideCardViewState,
  isResponseOverrideHttpMethod,
  isResponseOverrideMatchType,
} from '#shared/utils/responseOverrides';
import { JsonEditor } from '#widgets/response-overrides/components';
import { $collapsedResponseOverrideIds, responseOverrideExpandToggled } from '#widgets/response-overrides/model';

import * as S from '../styled';

const MATCH_TYPE_OPTIONS = [
  { value: ResponseOverrideMatchType.Contains, option: 'Contains' },
  { value: ResponseOverrideMatchType.Equals, option: 'Equals' },
  { value: ResponseOverrideMatchType.Regex, option: 'RegEx' },
];

const METHOD_OPTIONS = RESPONSE_OVERRIDE_HTTP_METHODS.map(method => ({ value: method, option: method }));

const STATUS_OPTIONS = RESPONSE_OVERRIDE_STATUS_CODES.map(status => ({
  value: String(status.code),
  option: formatStatusOption(status.code),
}));

type OverrideCardProps = {
  override: Omit<ResponseOverride, 'name' | 'url' | 'responseBody'> & {
    name?: string;
    url?: string;
    responseBody?: string;
  };
};

export function OverrideCard({ override }: OverrideCardProps) {
  const [isPaused, collapsedIds, onUpdated, onRemoved, onToggled, onExpandToggled] = useUnit([
    $isPaused,
    $collapsedResponseOverrideIds,
    selectedProfileResponseOverridesUpdated,
    selectedProfileResponseOverridesRemoved,
    selectedProfileResponseOverrideToggled,
    responseOverrideExpandToggled,
  ]);

  const overrideName = typeof override.name === 'string' ? override.name : '';
  const cardState = getOverrideCardViewState(override);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [draftName, setDraftName] = useState(overrideName);
  const isExpanded = !collapsedIds.includes(override.id);
  const { url, responseBody, showUrlError, isJsonValid } = cardState;

  useEffect(() => {
    if (!isEditingTitle) {
      setDraftName(overrideName);
    }
  }, [isEditingTitle, overrideName]);

  const persist = (patch: Partial<ResponseOverride>) => {
    onUpdated([
      {
        id: override.id,
        matchType: override.matchType,
        method: override.method,
        statusCode: override.statusCode,
        disabled: override.disabled,
        name: overrideName,
        url,
        responseBody,
        ...patch,
      },
    ]);
  };

  const confirmRename = () => {
    const nextName = draftName.trim() || overrideName;
    persist({ name: nextName });
    setDraftName(nextName);
    setIsEditingTitle(false);
  };

  const cancelRename = () => {
    setDraftName(overrideName);
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      confirmRename();
    }

    if (event.key === 'Escape') {
      cancelRename();
    }
  };

  return (
    <S.Card data-test-id='response-override-card'>
      <S.CardHeader>
        <S.TitleCluster>
          <Checkbox
            disabled={isPaused}
            checked={!override.disabled}
            onChange={() => onToggled(override.id)}
            data-test-id='response-override-checkbox'
          />

          {isEditingTitle ? (
            <S.TitleFieldWrapper>
              <FieldText
                size='m'
                inputMode='text'
                value={draftName}
                onChange={setDraftName}
                onKeyDown={handleTitleKeyDown}
                showClearButton={false}
                disabled={isPaused}
                data-test-id='response-override-title-input'
              />
            </S.TitleFieldWrapper>
          ) : (
            <S.Title data-test-id='response-override-title'>{overrideName}</S.Title>
          )}
        </S.TitleCluster>

        <S.HeaderActions>
          {isEditingTitle ? (
            <>
              <ButtonFunction
                disabled={isPaused}
                size='xs'
                icon={<CheckSVG />}
                onClick={confirmRename}
                data-test-id='response-override-rename-confirm'
              />
              <ButtonFunction
                disabled={isPaused}
                size='xs'
                icon={<CrossSVG />}
                onClick={cancelRename}
                data-test-id='response-override-rename-cancel'
              />
            </>
          ) : (
            <ButtonFunction
              disabled={isPaused}
              size='xs'
              icon={<EditSVG />}
              onClick={() => setIsEditingTitle(true)}
              data-test-id='response-override-rename-button'
            />
          )}
          <ButtonFunction
            disabled={isPaused}
            size='xs'
            icon={<CrossSVG />}
            onClick={() => onRemoved([override.id])}
            data-test-id='response-override-delete-button'
          />
          <ButtonFunction
            disabled={isPaused}
            size='xs'
            icon={isExpanded ? <ChevronUpSVG /> : <ChevronDownSVG />}
            onClick={() => onExpandToggled(override.id)}
            data-test-id='response-override-expand-button'
          />
        </S.HeaderActions>
      </S.CardHeader>

      {isExpanded && (
        <S.CardBody>
          <S.RequestRow>
            <FieldSelect
              size='m'
              selection='single'
              label={RESPONSE_OVERRIDE_COPY.ifRequest}
              labelTooltip={RESPONSE_OVERRIDE_COPY.matchTooltip}
              value={override.matchType}
              options={MATCH_TYPE_OPTIONS}
              showClearButton={false}
              disabled={isPaused}
              data-test-id='response-override-match-type'
              onChange={value => {
                if (typeof value === 'string' && isResponseOverrideMatchType(value)) {
                  persist({ matchType: value });
                }
              }}
            />
            <FieldText
              size='m'
              inputMode='text'
              label={RESPONSE_OVERRIDE_COPY.url}
              placeholder={RESPONSE_OVERRIDE_COPY.urlPlaceholder}
              value={url}
              showClearButton={false}
              disabled={isPaused}
              data-test-id='response-override-url'
              hint={showUrlError ? RESPONSE_OVERRIDE_COPY.incorrectFormat : undefined}
              validationState={showUrlError ? 'error' : 'default'}
              onChange={nextUrl => persist({ url: nextUrl })}
            />
          </S.RequestRow>

          <S.FieldRow>
            <FieldSelect
              size='m'
              label={RESPONSE_OVERRIDE_COPY.httpMethod}
              selection='single'
              value={override.method}
              options={METHOD_OPTIONS}
              showClearButton={false}
              disabled={isPaused}
              data-test-id='response-override-method'
              onChange={value => {
                if (typeof value === 'string' && isResponseOverrideHttpMethod(value)) {
                  persist({ method: value });
                }
              }}
            />
            <FieldSelect
              size='m'
              label={RESPONSE_OVERRIDE_COPY.statusCode}
              selection='single'
              value={String(override.statusCode)}
              options={STATUS_OPTIONS}
              showClearButton={false}
              disabled={isPaused}
              data-test-id='response-override-status'
              onChange={value => {
                if (typeof value !== 'string') {
                  return;
                }

                const statusCode = Number(value);

                if (Number.isInteger(statusCode)) {
                  persist({ statusCode });
                }
              }}
            />
          </S.FieldRow>

          <FieldDecorator size='m' label={RESPONSE_OVERRIDE_COPY.json}>
            <JsonEditor
              value={responseBody}
              invalid={!isJsonValid}
              hint={!isJsonValid ? RESPONSE_OVERRIDE_COPY.incorrectFormat : undefined}
              disabled={isPaused}
              data-test-id='response-override-json'
              onChange={nextResponseBody => persist({ responseBody: nextResponseBody })}
            />
          </FieldDecorator>
        </S.CardBody>
      )}
    </S.Card>
  );
}
