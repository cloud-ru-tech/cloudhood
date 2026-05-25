import { useSortable } from '@dnd-kit/sortable';
import { useUnit } from 'effector-react/effector-react.mjs';
import { type ClipboardEvent, type KeyboardEvent, useState } from 'react';

import { ButtonFunction } from '@snack-uikit/button';
import { FieldText } from '@snack-uikit/fields';
import { themeVars } from '@snack-uikit/figma-tokens';
import { CrossSVG, WarningSVG } from '@snack-uikit/icons';
import { Checkbox, CheckboxProps } from '@snack-uikit/toggles';
import { Tooltip } from '@snack-uikit/tooltip';

import { $isPaused } from '#entities/is-paused/model';
import type { RequestHeader } from '#entities/request-profile/types';
import { DragHandle } from '#entities/sortable-list';
import { DELIMITER, NEW_ROW } from '#features/selected-profile-request-headers/paste/constant';
import { selectedProfileRequestHeadersPasted } from '#features/selected-profile-request-headers/paste/model';
import { selectedProfileRequestHeadersRemoved } from '#features/selected-profile-request-headers/remove/model';
import { selectedProfileRequestHeadersUpdated } from '#features/selected-profile-request-headers/update/model';
import { validateHeaderName, validateHeaderValue } from '#shared/utils/headers';

import { RequestHeaderMenu } from './RequestHeaderMenu';
import * as S from './styled';

export function RequestHeaderRow({ isStuck, ...props }: RequestHeader & { isStuck?: boolean }) {
  const { disabled, name, value, id } = props;
  const { setNodeRef, listeners, attributes, transition, transform, isDragging } = useSortable({ id });
  const { isPaused } = useUnit({
    isPaused: $isPaused,
  });

  const isNameFormatVerified = validateHeaderName(name);
  const isValueFormatVerified = validateHeaderValue(value);

  const [headerNameFocused, setHeaderNameFocused] = useState(false);

  const onHeaderNameFocused = () => setHeaderNameFocused(true);
  const onHeaderNameBlur = () => setHeaderNameFocused(false);

  const handlePaste = (field: 'value' | 'name') => (e: ClipboardEvent<HTMLInputElement>) => {
    const value = e.clipboardData.getData('text/plain');

    if (![DELIMITER, NEW_ROW].some(item => value.includes(item))) {
      return;
    }

    e.preventDefault();
    selectedProfileRequestHeadersPasted({ id, value, field });
  };

  const handleKeyPress = (event: KeyboardEvent<HTMLInputElement>) => {
    const target = event.target as HTMLInputElement;
    const cursorPosition = target.selectionStart;
    if (event.key === ' ' && cursorPosition === 0) {
      event.preventDefault();
    }
  };

  const handleChange = (field: 'value' | 'name') => (value: string) => {
    selectedProfileRequestHeadersUpdated([{ ...props, [field]: value }]);
  };

  const handleChecked: CheckboxProps['onChange'] = checked => {
    selectedProfileRequestHeadersUpdated([{ ...props, disabled: !checked }]);
  };

  return (
    <S.Wrapper ref={setNodeRef} transform={transform} transition={transition} isDragging={isDragging}>
      <S.LeftHeaderActions>
        <DragHandle disabled={isPaused} listeners={listeners} attributes={attributes} />

        <Checkbox
          data-test-id='request-header-checkbox'
          disabled={isPaused}
          checked={!disabled}
          onChange={handleChecked}
        />

        {isStuck && (
          <Tooltip
            tip="This header couldn't be applied by Chrome. Try toggling it or restarting the browser."
            placement='top'
          >
            <span data-test-id='header-stuck-warning' style={{ display: 'flex' }}>
              <WarningSVG size={16} style={{ color: themeVars.sys.orange.accentDefault, flexShrink: 0 }} />
            </span>
          </Tooltip>
        )}

        <Tooltip
          open={headerNameFocused && name.length > 0 && !isNameFormatVerified}
          tip='Header names may only include Latin characters without spaces and these special symbols: (),/:;<=>?@[]{}")'
          placement='top'
        >
          <FieldText
            data-test-id='header-name-input'
            size='m'
            value={name}
            placeholder='Header name'
            onChange={handleChange('name')}
            onPaste={handlePaste('name')}
            onKeyDown={handleKeyPress}
            onFocus={onHeaderNameFocused}
            onBlur={onHeaderNameBlur}
            showClearButton={false}
            disabled={isPaused}
            validationState={name.length > 0 && !isNameFormatVerified ? 'error' : 'default'}
          />
        </Tooltip>
      </S.LeftHeaderActions>

      <Tooltip
        tip='Incorrect format for header value'
        placement='top'
        open={value.length > 0 && !isValueFormatVerified}
      >
        <FieldText
          size='m'
          value={value}
          placeholder='Header value'
          onChange={handleChange('value')}
          onPaste={handlePaste('value')}
          onKeyDown={handleKeyPress}
          showClearButton={false}
          disabled={isPaused}
          data-test-id='header-value-input'
          validationState={value.length > 0 && !isValueFormatVerified ? 'error' : 'default'}
        />
      </Tooltip>

      <ButtonFunction
        disabled={isPaused}
        size='s'
        data-test-id='remove-request-header-button'
        icon={<CrossSVG />}
        onClick={() => selectedProfileRequestHeadersRemoved([id])}
      />

      <RequestHeaderMenu {...props} />
    </S.Wrapper>
  );
}
