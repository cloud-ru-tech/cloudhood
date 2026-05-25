import { useSortable } from '@dnd-kit/sortable';
import { useUnit } from 'effector-react/effector-react.mjs';
import { type KeyboardEvent, useState } from 'react';

import { ButtonFunction } from '@snack-uikit/button';
import { FieldText } from '@snack-uikit/fields';
import { CrossSVG } from '@snack-uikit/icons';
import { Checkbox, CheckboxProps } from '@snack-uikit/toggles';
import { Tooltip } from '@snack-uikit/tooltip';

import { $isPaused } from '#entities/is-paused/model';
import type { RequestCookie } from '#entities/request-profile/types';
import { DragHandle } from '#entities/sortable-list';
import { selectedProfileRequestCookiesRemoved } from '#features/selected-profile-request-cookies/remove/model';
import { selectedProfileRequestCookiesUpdated } from '#features/selected-profile-request-cookies/update/model';
import { validateCookieName, validateCookieValue } from '#shared/utils/cookies';

import * as S from './styled';

export function RequestCookieRow(props: RequestCookie) {
  const { disabled, name, value, id } = props;
  const { setNodeRef, listeners, attributes, transition, transform, isDragging } = useSortable({ id });
  const { isPaused } = useUnit({ isPaused: $isPaused });

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
    selectedProfileRequestCookiesUpdated([{ ...props, [field]: val }]);
  };

  const handleChecked: CheckboxProps['onChange'] = checked => {
    selectedProfileRequestCookiesUpdated([{ ...props, disabled: !checked }]);
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

        <Tooltip
          open={cookieNameFocused && name.length > 0 && !isNameFormatVerified}
          tip='Cookie names may only include ASCII characters without spaces, semicolons, or equals signs'
          placement='top'
        >
          <FieldText
            data-test-id='cookie-name-input'
            size='m'
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
      </S.LeftHeaderActions>

      <Tooltip
        tip='Incorrect format for cookie value'
        placement='top'
        open={value.length > 0 && !isValueFormatVerified}
      >
        <FieldText
          size='m'
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

      <ButtonFunction
        disabled={isPaused}
        size='s'
        data-test-id='remove-request-cookie-button'
        icon={<CrossSVG />}
        onClick={() => selectedProfileRequestCookiesRemoved([id])}
      />
    </S.Wrapper>
  );
}
