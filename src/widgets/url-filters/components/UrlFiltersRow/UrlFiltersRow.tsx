import { useSortable } from '@dnd-kit/sortable';
import { useUnit } from 'effector-react/effector-react.mjs';
import { type ClipboardEvent, type KeyboardEvent } from 'react';

import { ButtonFunction } from '@snack-uikit/button';
import { FieldText } from '@snack-uikit/fields';
import { CrossSVG } from '@snack-uikit/icons';
import { Checkbox, CheckboxProps } from '@snack-uikit/toggles';
import { Tooltip } from '@snack-uikit/tooltip';

import { $isPaused } from '#entities/is-paused/model';
import type { UrlFilter } from '#entities/request-profile/types';
import { DragHandle } from '#entities/sortable-list';
import { selectedProfileUrlFiltersRemoved } from '#features/selected-profile-url-filters/remove/model';
import { selectedProfileUrlFiltersUpdated } from '#features/selected-profile-url-filters/update/model';
import { validateHeaderValue } from '#shared/utils/headers';

import * as S from './styled';

export function UrlFiltersRow(props: UrlFilter) {
  const { disabled, value, id } = props;
  const { setNodeRef, listeners, attributes, transition, transform, isDragging } = useSortable({ id });
  const { isPaused } = useUnit({
    isPaused: $isPaused,
  });

  const isValueFormatVerified = validateHeaderValue(value);

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const value = e.clipboardData.getData('text/plain');

    e.preventDefault();
    selectedProfileUrlFiltersUpdated([{ ...props, value }]);
  };

  const handleKeyPress = (event: KeyboardEvent<HTMLInputElement>) => {
    const target = event.target as HTMLInputElement;
    const cursorPosition = target.selectionStart;
    if (event.key === ' ' && cursorPosition === 0) {
      event.preventDefault();
    }
  };

  const handleChange = (value: string) => {
    selectedProfileUrlFiltersUpdated([{ ...props, value }]);
  };

  const handleChecked: CheckboxProps['onChange'] = checked => {
    selectedProfileUrlFiltersUpdated([{ ...props, disabled: !checked }]);
  };

  return (
    <S.Wrapper ref={setNodeRef} transform={transform} transition={transition} isDragging={isDragging}>
      <DragHandle disabled={isPaused} listeners={listeners} attributes={attributes} />
      <Checkbox disabled={isPaused} checked={!disabled} onChange={handleChecked} />

      <Tooltip
        tip='Incorrect format for header value'
        placement='top'
        open={value.length > 0 && !isValueFormatVerified}
      >
        <FieldText
          size='m'
          value={value}
          placeholder='.*://url.domain/.*'
          onChange={handleChange}
          onPaste={handlePaste}
          onKeyDown={handleKeyPress}
          showClearButton={false}
          disabled={isPaused}
          validationState={value.length > 0 && !isValueFormatVerified ? 'error' : 'default'}
        />
      </Tooltip>

      <ButtonFunction
        disabled={isPaused}
        size='s'
        icon={<CrossSVG />}
        onClick={() => selectedProfileUrlFiltersRemoved([id])}
      />
    </S.Wrapper>
  );
}
