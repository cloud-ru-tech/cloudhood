import { useSortable } from '@dnd-kit/sortable';
import { useUnit } from 'effector-react/effector-react.mjs';
import { type KeyboardEvent, useState } from 'react';

import { ButtonFunction } from '@snack-uikit/button';
import { CrossSVG } from '@snack-uikit/icons';
import { Checkbox, CheckboxProps } from '@snack-uikit/toggles';
import { Tooltip } from '@snack-uikit/tooltip';

import { $isPaused } from '#entities/is-paused/model';
import type { RequestCookie } from '#entities/request-profile/types';
import { DragHandle } from '#entities/sortable-list';
import { selectedProfileRequestCookiesRemoved } from '#features/selected-profile-request-cookies/remove/model';
import { selectedProfileRequestCookiesUpdated } from '#features/selected-profile-request-cookies/update/model';
import { validateCookieName, validateCookieValue } from '#shared/utils/cookies';

import { RequestCookieMenu } from './RequestCookieMenu';
import * as S from './styled';

export function RequestCookieRow(props: RequestCookie) {
  const { disabled, name, value, id } = props;
  const { setNodeRef, listeners, attributes, transition, transform, isDragging } = useSortable({ id });
  const { isPaused, onRequestCookiesUpdated, onRequestCookiesRemoved } = useUnit({
    isPaused: $isPaused,
    onRequestCookiesUpdated: selectedProfileRequestCookiesUpdated,
    onRequestCookiesRemoved: selectedProfileRequestCookiesRemoved,
  });

  const isNameFormatVerified = validateCookieName(name);
  const isValueFormatVerified = validateCookieValue(value);

  const [cookieNameFocused, setCookieNameFocused] = useState(false);

  const handleKeyPress = (event: KeyboardEvent<HTMLInputElement>) => {
    const target = event.target as HTMLInputElement;
    if (event.key === ' ' && target.selectionStart === 0) {
      event.preventDefault();
    }
  };

  const handleChange = (field: 'value' | 'name') => (val: string) => {
    onRequestCookiesUpdated([{ ...props, [field]: val }]);
  };

  const handleChecked: CheckboxProps['onChange'] = checked => {
    onRequestCookiesUpdated([{ ...props, disabled: !checked }]);
  };

  return (
    <S.Wrapper ref={setNodeRef} transform={transform} transition={transition} isDragging={isDragging}>
      <S.LeftHeaderActions>
        <DragHandle disabled={isPaused} listeners={listeners} attributes={attributes} />

        <Checkbox
          data-test-id='request-cookie-checkbox'
          disabled={isPaused}
          checked={!disabled}
          onChange={handleChecked}
        />
      </S.LeftHeaderActions>

      <S.CookieFieldWrapper grow={216}>
        <Tooltip
          open={cookieNameFocused && name.length > 0 && !isNameFormatVerified}
          tip='Cookie names may only include ASCII characters without spaces, semicolons, or equals signs'
          placement='top'
        >
          <S.CookieNameField
            data-test-id='cookie-name-input'
            size='m'
            inputMode='text'
            value={name}
            placeholder='Cookie name'
            onChange={handleChange('name')}
            onKeyDown={handleKeyPress}
            onFocus={() => setCookieNameFocused(true)}
            onBlur={() => setCookieNameFocused(false)}
            showClearButton={false}
            disabled={isPaused}
            validationState={name.length > 0 && !isNameFormatVerified ? 'error' : 'default'}
          />
        </Tooltip>
      </S.CookieFieldWrapper>

      <S.CookieFieldWrapper grow={205}>
        <Tooltip
          tip='Incorrect format for cookie value'
          placement='top'
          open={value.length > 0 && !isValueFormatVerified}
        >
          <S.CookieValueField
            size='m'
            inputMode='text'
            value={value}
            placeholder='Cookie value'
            onChange={handleChange('value')}
            onKeyDown={handleKeyPress}
            showClearButton={false}
            disabled={isPaused}
            data-test-id='cookie-value-input'
            validationState={value.length > 0 && !isValueFormatVerified ? 'error' : 'default'}
          />
        </Tooltip>
      </S.CookieFieldWrapper>

      <ButtonFunction
        disabled={isPaused}
        size='s'
        data-test-id='remove-request-cookie-button'
        icon={<CrossSVG />}
        onClick={() => onRequestCookiesRemoved([id])}
      />

      <RequestCookieMenu {...props} />
    </S.Wrapper>
  );
}
